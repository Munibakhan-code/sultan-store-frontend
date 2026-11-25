import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import { getApiErrorMessage, getApiErrorStatus, tokenStorage } from "@/services/apiClient";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** True while the initial session lookup is in flight. */
  isLoading: boolean;
  /** True while login/register/logout is in flight. */
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const current = await authService.me();
      setUser(current);
      return current;
    } catch (err) {
      const status = getApiErrorStatus(err);
      if (status === 401 || status === 403) tokenStorage.clear();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await refreshUser();
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { user: loggedIn } = await authService.login(payload);
      setUser(loggedIn);
      return loggedIn;
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to sign in.");
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      // Backend may require email verification before a session exists.
      setUser(response.user ?? null);
      return response.user ?? null;
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to create your account.");
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await authService.logout();
    } catch {
      // Session is cleared locally regardless of the network result.
    } finally {
      setUser(null);
      setIsSubmitting(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isLoading,
      isSubmitting,
      error,
      clearError: () => setError(null),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, isSubmitting, error, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
