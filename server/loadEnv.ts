import dotenv from "dotenv";

/**
 * Side-effect module: loads environment files for every Node entry point (the API
 * server and the scripts under `scripts/`).
 *
 * `.env.local` is read first because dotenv keeps the first value it sees for a
 * given key, so local overrides win over `.env`. Vite does this automatically for
 * the client bundle; Node does not, and a plain `import "dotenv/config"` reads only
 * `.env` — which silently ignores the file the README tells you to fill in.
 *
 * Paths resolve against the working directory, which npm always sets to the
 * package root.
 */
dotenv.config({ path: ".env.local" });
dotenv.config();
