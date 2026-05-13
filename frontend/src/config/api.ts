// ─── API endpoint configuration ───────────────────────────────────────────────
// To change the production URL, update REMOTE_URL below.
// Electron and mobile apps read this at runtime; the web build uses it at
// build-time via VITE_API_URL or falls back to the relative proxy path.

// Change this one line when your domain is ready (e.g. "https://yourdomain.com/api/graphql")
export const REMOTE_URL = "http://185.217.125.37:3030/api/graphql";
export const LOCAL_URL  = "http://localhost:5000/graphql";

// In the browser/web build served by Nginx, the proxy rewrites /api/graphql
// to the backend container, so we keep the relative path for that case.
const WEB_RELATIVE = "/api/graphql";

export function getApiUrl(): string {
  // 1. Electron runtime: preload loads settings synchronously at startup,
  //    so getApiUrl() returns a plain string (not a Promise).
  if (typeof window !== "undefined" && (window as any).electronAPI?.getApiUrl) {
    return (window as any).electronAPI.getApiUrl() as string;
  }

  // 2. Explicit Vite env override (custom deployments or local dev with VITE_API_URL)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }

  // 3. Electron build without preload (static file served via custom protocol)
  //    import.meta.env.VITE_ELECTRON is injected by vite build --mode electron
  if (import.meta.env.VITE_ELECTRON === "true") {
    return REMOTE_URL;
  }

  // 4. Standard web build — use relative path (proxied by Nginx)
  return WEB_RELATIVE;
}
