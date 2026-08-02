const TOKEN_KEY = "ethosk.token";

/**
 * In production the frontend and backend are separate Render services, so the
 * browser cannot rely on a dev-server proxy.  Set VITE_API_URL to the full
 * backend origin (e.g. https://ethosk-backend.onrender.com) and it will be
 * baked in at build time.  During local development the Vite proxy handles
 * /api → localhost:4000, so the variable can be left unset.
 */
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Carries the server's error code so callers can branch on it, not on message text. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: string[],
    readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Set for multipart uploads, where the browser must pick the boundary. */
  formData?: FormData;
  signal?: AbortSignal;
}

async function readJsonBody<T>(response: Response): Promise<T | undefined> {
  const text = await response.text();
  if (!text.trim()) return undefined;
  return JSON.parse(text) as T;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}/api${path}`, {
    method: options.method ?? (options.body || options.formData ? "POST" : "GET"),
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    signal: options.signal,
  });

  if (!response.ok) {
    let code = "REQUEST_FAILED";
    let message = `Request failed with status ${response.status}`;
    let fields: string[] | undefined;
    let errorData: Record<string, unknown> | undefined;

    try {
      const payload = await readJsonBody<any>(response);
      if (payload) {
        errorData = payload;
        if (typeof payload.error === "string") {
          code = payload.error;
          message = payload.message || message;
        } else if (payload.error) {
          code = payload.error.code || code;
          message = payload.error.message || message;
          fields = payload.error.fields;
        } else if (payload.message) {
          message = payload.message;
        }
      }
    } catch {
      // A non-JSON error body leaves the status-based defaults in place.
    }

    if (response.status === 401) setToken(null);
    throw new ApiRequestError(response.status, code, message, fields, errorData);
  }

  if (response.status === 204) return undefined as T;
  const payload = await readJsonBody<T>(response);
  return payload as T;
}
