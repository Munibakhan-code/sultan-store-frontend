import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MailCheck, XCircle, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { notify } from "@/components/common/Toast";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/services/apiClient";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify Email — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Confirm your email address to activate your Sultan Official PUBG Store account.",
      },
      { property: "og:title", content: "Verify Email — Sultan Official PUBG Store" },
      { property: "og:description", content: "Activate your Sultan Store account." },
    ],
  }),
  component: VerifyEmailPage,
});

type Status = "idle" | "verifying" | "verified" | "failed";

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    (async () => {
      try {
        await authService.verifyEmail(token);
        await refreshUser();
        setStatus("verified");
      } catch (err) {
        setError(getApiErrorMessage(err, "This verification link is invalid or has expired."));
        setStatus("failed");
      }
    })();
  }, [token, refreshUser]);

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await authService.resendVerification(user?.email);
      notify.success("Verification email sent", "Check your inbox for the new link.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to resend the verification email."));
    } finally {
      setResending(false);
    }
  }

  const verified = status === "verified" || user?.emailVerified;

  return (
    <AuthLayout
      title="Verify Email"
      subtitle="Your account needs a confirmed email address"
      footer={
        <Link to="/home" className="font-semibold text-primary hover:underline">
          Go to homepage
        </Link>
      }
    >
      <div className="space-y-5 text-center">
        {status === "verifying" ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Verifying your email address…</p>
          </div>
        ) : verified ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="font-display text-lg font-bold uppercase text-foreground">
              Email verified
            </p>
            <p className="text-sm text-muted-foreground">
              Your account is active. You can start using Sultan Store.
            </p>
            <Link to="/home" className="w-full">
              <Button full>Continue</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {status === "failed" ? (
              <XCircle className="h-12 w-12 text-destructive" />
            ) : (
              <MailCheck className="h-12 w-12 text-primary" />
            )}
            <p className="font-display text-lg font-bold uppercase text-foreground">
              {status === "failed" ? "Verification failed" : "Check your inbox"}
            </p>
            <p className="text-sm text-muted-foreground">
              {status === "failed"
                ? "That link didn't work. Request a fresh verification email below."
                : `We sent a verification link${user?.email ? ` to ${user.email}` : ""}. Click it to activate your account.`}
            </p>

            {/* Prominent spam warning */}
            {status !== "failed" && (
              <div className="w-full rounded-lg border-2 border-warning/30 bg-warning/10 p-4 flex items-start gap-3 text-left">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-warning">Didn't receive the email?</p>
                  <p className="text-sm text-muted-foreground">
                    Please check your <span className="font-semibold">spam</span> or{" "}
                    <span className="font-semibold">junk</span> folder. Add our email address to your
                    contacts to ensure future emails reach your inbox.
                  </p>
                </div>
              </div>
            )}

            <ErrorMessage message={error} className="w-full text-left" />
            <Button variant="outline" full isLoading={resending} onClick={handleResend}>
              Resend verification email
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}