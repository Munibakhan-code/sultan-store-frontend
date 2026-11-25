import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, User } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { notify } from "@/components/common/Toast";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Register a free Sultan Official PUBG Store account to buy verified PUBG accounts.",
      },
      { property: "og:title", content: "Create Account — Sultan Official PUBG Store" },
      { property: "og:description", content: "Join Sultan Official PUBG Store in seconds." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
    try {
      const user = await register(form);
      notify.success("Account created", "Check your inbox to verify your email address.");
      navigate({ to: user?.role === "admin" ? "/admin" : "/verify-email", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the Sultan Store community"
      footer={
        <span className="text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorMessage message={error} />
        <Input
          label="Full name"
          required
          autoComplete="name"
          placeholder="Sultan Ahmed"
          leadingIcon={<User className="h-4 w-4" />}
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          leadingIcon={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
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
        <Button type="submit" full isLoading={isSubmitting}>
          Register
        </Button>
      </form>
    </AuthLayout>
  );
}
