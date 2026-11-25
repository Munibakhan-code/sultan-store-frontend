import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { notify } from "@/components/common/Toast";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset Password — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Set a new password for your Sultan Official PUBG Store account.",
      },
      { property: "og:title", content: "Reset Password — Sultan Official PUBG Store" },
      { property: "og:description", content: "Choose a new password for your Sultan Store account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ token: token ?? "", ...form });
      notify.success("Password updated", "You can now sign in with your new password.");
      navigate({ to: "/login", replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reset your password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Choose a new password for your account"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorMessage message={error} />
        {!token ? (
          <ErrorMessage message="This reset link is missing its token. Request a new link." />
        ) : null}
        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 8 characters."
          placeholder="••••••••"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />
        <Button type="submit" full isLoading={loading}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
