import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { isClaudeConfigured } from "./lib/ai/index.js";
import { isAddisAiConfigured } from "./lib/ai/addisai.js";
import { attachAuth } from "./lib/auth.js";
import { errorHandler } from "./lib/http.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { researchersRouter } from "./routes/researchers.js";
import { respondentsRouter } from "./routes/respondents.js";
import { surveysRouter } from "./routes/surveys.js";
import { walletRouter } from "./routes/wallet.js";

const app = express();

app.use(cors({
  // Accept requests from the configured frontend URL *and* any Render preview
  // subdomain so feature-branch deploys work without extra config.
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin / server-to-server
    if (
      origin === env.siteUrl ||
      /^http:\/\/(localhost|127\.0\.0\.1):(3000|3001|5173)$/.test(origin) ||
      /^https:\/\/[\w-]+-ethosk\.onrender\.com$/.test(origin) ||
      /\.onrender\.com$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(attachAuth());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    env: env.nodeEnv,
    providers: {
      claude: isClaudeConfigured(),
      addis_ai: isAddisAiConfigured(),
    },
    fayda_stub_enabled: env.allowFaydaStub,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/respondents", respondentsRouter);
app.use("/api/researchers", researchersRouter);
app.use("/api/surveys", surveysRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/admin", adminRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "No such endpoint." } });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[ethosk] API listening on http://localhost:${env.port}`);
  // #region agent log
  fetch("http://127.0.0.1:7633/ingest/c9e0799e-dbd9-4f3c-a083-52abf8426277", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "fc5c0e" },
    body: JSON.stringify({
      sessionId: "fc5c0e",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "server/index.ts:listen",
      message: "API server listening",
      data: { port: env.port },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!isClaudeConfigured()) {
    console.warn("[ethosk] ANTHROPIC_API_KEY not set — AI features will use their fallbacks.");
  }
  if (!isAddisAiConfigured()) {
    console.warn("[ethosk] ADDIS_AI_API_KEY not set — translation will fall back to Claude.");
  }
});
