import { apiClient, extractAccessToken, tokenStorage } from "./apiClient";
import type {
  ApiMessage,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from "@/types/auth";

type Row = Record<string, unknown>;

/** The backend calls the display name `name` and verification `isEmailVerified`. */
function normaliseUser(raw: unknown): User {
  const row = (raw ?? {}) as Row;
  return {
    id: String(row["_id"] ?? row["id"] ?? ""),
    fullName: String(row["name"] ?? row["fullName"] ?? "Customer"),
    email: String(row["email"] ?? ""),
    role: (String(row["role"] ?? "user") as User["role"]),
    emailVerified: Boolean(row["isEmailVerified"] ?? row["emailVerified"] ?? false),
    avatarUrl: (row["avatarUrl"] as string | undefined) ?? null,
    ...(row["createdAt"] ? { createdAt: String(row["createdAt"]) } : {}),
  };
}

function toAuthResponse(data: unknown): AuthResponse {
  const body = (data ?? {}) as Row;
  const auth = (body["auth"] ?? body["session"] ?? {}) as Row;
  const token = extractAccessToken(body) ?? extractAccessToken(auth);
  return {
    user: normaliseUser(body["user"] ?? body),
    ...(token ? { token: String(token) } : {}),
  };
}

/**
 * Express backend auth endpoints. The session lives in an HTTP-only cookie; the
 * optional bearer token is stored only when the backend returns one.
 */
export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post("/auth/register", {
      name: payload.fullName,
      email: payload.email,
      password: payload.password,
    });
    const response = toAuthResponse(data);
    if (response.token) tokenStorage.set(response.token);
    return response;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post("/auth/login", {
      email: payload.email,
      password: payload.password,
    });
    const response = toAuthResponse(data);
    console.info("[Auth] Login response processed", {
      tokenReceived: Boolean(response.token),
      tokenLength: response.token?.length ?? 0,
      storage: payload.remember ? "localStorage" : "sessionStorage",
    });
    if (response.token) tokenStorage.set(response.token, payload.remember ?? false);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      tokenStorage.clear();
    }
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get("/auth/me");
    const body = (data ?? {}) as Row;
    return normaliseUser(body["user"] ?? body);
  },

  async forgotPassword(email: string): Promise<ApiMessage> {
    const { data } = await apiClient.post<ApiMessage>("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ApiMessage> {
    const { data } = await apiClient.post<ApiMessage>("/auth/reset-password", {
      token: payload.token,
      password: payload.password,
    });
    return data;
  },

  async verifyEmail(token: string): Promise<ApiMessage> {
    const { data } = await apiClient.post<ApiMessage>("/auth/verify-email", { token });
    return data;
  },

  async resendVerification(email?: string): Promise<ApiMessage> {
    const { data } = await apiClient.post<ApiMessage>("/auth/resend-verification", { email });
    return data;
  },
};
