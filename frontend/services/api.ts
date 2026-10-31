import { API_V1 } from "@/lib/config";

const TOKEN_KEY = "kelana_token";
const TOKEN_EVENT = "kelana-token-change";

// ─── Token storage (Session 8: JWT kept in localStorage) ───────────────────

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable (private mode) — session-only */
  }
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function subscribeToken(callback: () => void): () => void {
  window.addEventListener(TOKEN_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(TOKEN_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ─── HTTP helper ───────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function errorMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : "";
    return `${field ? `${field}: ` : ""}${first.msg ?? "Invalid input"}`;
  }
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status >= 500) return "The server had a problem. Please try again.";
  return `Request failed (${status})`;
}

export async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  if (init.body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_V1}${path}`, { ...init, headers: finalHeaders });
  } catch {
    throw new ApiError("Cannot reach the KelanaAI server. Check your connection and try again.", 0);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth) clearToken();
    throw new ApiError(errorMessage(response.status, body), response.status);
  }
  return body as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
