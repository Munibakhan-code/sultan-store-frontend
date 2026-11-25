import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { notify } from "@/components/common/Toast";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Login — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Sign in to your Sultan Official PUBG Store account to manage orders and purchases.",
      },
      { property: "og:title", content: "Login — Sultan Official PUBG Store" },
      { property: "og:description", content: "Access your Sultan Official PUBG Store account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(form);
      notify.success("Welcome back", user.fullName || user.email);
      navigate({ to: user.role === "admin" ? "/admin" : "/home", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  }

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Access your Sultan Store account"
      footer={
        <span className="text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorMessage message={error} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          leadingIcon={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" full isLoading={isSubmitting}>
          Login
        </Button>
      </form>
    </AuthLayout>
  );
}
