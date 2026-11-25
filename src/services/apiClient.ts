import axios, { AxiosError } from "axios";

/**
 * Central Axios instance. All requests go through here so interceptors,
 * auth headers and error normalisation live in one place.
 * API base URL comes from the environment (see .env.example).
 */
export const API_BASE_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:5000";

const TOKEN_STORAGE_KEY = "sultan.auth.token";

const LEGACY_TOKEN_KEYS = ["token", "accessToken", "access_token", "authToken", "jwt"] as const;
const READABLE_COOKIE_TOKEN_KEYS = [...LEGACY_TOKEN_KEYS, "auth_token"] as const;
const SESSION_KEYS = ["sultan.auth", "auth", "session"] as const;

type UnknownRow = Record<string, unknown>;

/** Extracts a bearer token from the response shapes used by common auth APIs. */
export function extractAccessToken(value: unknown, depth = 0): string | null {
  if (!value || typeof value !== "object" || depth > 3) return null;
  const row = value as UnknownRow;

  for (const key of LEGACY_TOKEN_KEYS) {
    const candidate = row[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  for (const key of ["data", "auth", "session", "result"] as const) {
    const nested = extractAccessToken(row[key], depth + 1);
    if (nested) return nested;
  }

  return null;
}

function readTokenFromBrowserFallbacks(): string | null {
  for (const store of [localStorage, sessionStorage]) {
    for (const key of LEGACY_TOKEN_KEYS) {
      const token = store.getItem(key)?.trim();
      if (token) return token;
    }

    for (const key of SESSION_KEYS) {
      const value = store.getItem(key);
      if (!value) continue;
      try {
        const token = extractAccessToken(JSON.parse(value));
        if (token) return token;
      } catch {
        // Ignore unrelated or malformed legacy storage entries.
      }
    }
  }

  // `auth_token` is normally HttpOnly and therefore intentionally invisible to
  // JavaScript. This fallback still supports development/backends that expose
  // the same cookie without HttpOnly.
  const cookieNames = new Set<string>(READABLE_COOKIE_TOKEN_KEYS);
  for (const entry of document.cookie.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    const name = entry.slice(0, separator).trim();
    if (!cookieNames.has(name)) continue;
    const token = decodeURIComponent(entry.slice(separator + 1)).trim();
    if (token) return token;
  }

  return null;
}

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) return stored;

    const recovered = readTokenFromBrowserFallbacks();
    if (recovered) {
      localStorage.setItem(TOKEN_STORAGE_KEY, recovered);
      console.info("[Auth] Recovered token from a legacy browser session", {
        tokenPresent: true,
        tokenLength: recovered.length,
      });
    }
    return recovered;
  },
  set(token: string, remember = true) {
    if (typeof window === "undefined") return;
    const store = remember ? localStorage : sessionStorage;
    const otherStore = remember ? sessionStorage : localStorage;
    otherStore.removeItem(TOKEN_STORAGE_KEY);
    store.setItem(TOKEN_STORAGE_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, "")}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * The backend wraps every payload as { success, data }. Unwrap it once here so
 * services only ever deal with the domain payload.
 */
apiClient.interceptors.response.use((response) => {
  const body = response.data as { success?: boolean; data?: unknown } | undefined;
  const authorization = response.headers["authorization"];
  const headerToken =
    response.headers["x-auth-token"] ??
    (typeof authorization === "string" && authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : null);
  const responseToken = headerToken || extractAccessToken(body);

  // Capture before unwrapping: some APIs return { data: { user }, token }.
  if (responseToken) {
    const remember =
      typeof window !== "undefined" && Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
    tokenStorage.set(responseToken, remember);
    console.info("[Auth] Token captured from API response", {
      tokenPresent: true,
      tokenLength: responseToken.length,
      source: headerToken ? "header" : "body",
    });
  }

  if (body && typeof body === "object" && "success" in body && "data" in body) {
    response.data = body.data;
  }
  return response;
});

/** Reads a File as a data URL — the backend accepts base64 uploads. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Turn any Axios/network failure into a human-readable message. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; error?: string; errors?: { field?: string; message?: string }[] }
      | undefined;
    const fieldErrors = (data?.errors ?? [])
      .map((entry) => entry?.message)
      .filter((message): message is string => Boolean(message));
    if (fieldErrors.length > 0) return fieldErrors.join(" ");
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.code === "ERR_NETWORK") return "Cannot reach the server. Please try again.";
    if (error.response?.status === 401) return "Invalid credentials.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

/**
 * Slow media uploads can abort client-side or time out at the gateway. Those are
 * not real failures for the user, so callers treat them as "still processing".
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return true;
    if (/timeout/i.test(error.message ?? "")) return true;
    const message = (error.response?.data as { message?: string } | undefined)?.message ?? "";
    if (/timeout|timed out/i.test(message)) return true;
    if (error.response?.status === 504 || error.response?.status === 408) return true;
  }
  return false;
}

/** Error message with timeout noise replaced by a calm, non-alarming wording. */
export function getUploadErrorMessage(error: unknown, fallback = "Upload failed."): string {
  if (isTimeoutError(error)) return "The server is still processing this file. Please refresh in a moment.";
  return getApiErrorMessage(error, fallback);
}
