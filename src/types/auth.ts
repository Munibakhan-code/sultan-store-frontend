export type UserRole = "user" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface ApiMessage {
  message: string;
}
