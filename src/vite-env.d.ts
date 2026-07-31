/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full URL of the backend API service (e.g. https://ethosk-backend.onrender.com). */
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
