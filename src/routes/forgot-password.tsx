import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { notify } from "@/components/common/Toast";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Request a password reset link for your Sultan Official PUBG Store account.",
      },
      { property: "og:title", content: "Forgot Password — Sultan Official PUBG Store" },
      { property: "og:description", content: "Recover access to your Sultan Store account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      notify.success("Reset link sent", "Check your email for the reset instructions.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to send the reset link."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="We'll email you a secure reset link"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, a reset link
            is on its way.
          </p>
          <Button variant="outline" full onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <ErrorMessage message={error} />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            leadingIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" full isLoading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
