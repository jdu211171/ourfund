import { Lock, Eye, ArrowLeft } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";
import { resetPasswordServerFn, requestPasswordResetServerFn } from "@/lib/server-fns";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function ResetPasswordScreen() {
  const { navigate, resetToken } = useAppNavigation();
  const [phase, setPhase] = useState<"request" | "reset">(resetToken ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async () => {
    if (!email) return;
    setError("");
    setLoading(true);
    try {
      await requestPasswordResetServerFn({ data: { email } });
      setSuccess(true);
      setEmail("");
      setTimeout(() => {
        setSuccess(false);
        navigate("login");
      }, 3000);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to request password reset"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPasswordServerFn({ data: { token: resetToken || "", password } });
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setSuccess(false);
        navigate("login");
      }, 2000);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  const isRequestValid = email && !loading;
  const isResetValid = password && confirmPassword && password.length >= 8 && !loading;

  if (success) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col items-center justify-center px-7">
          <div
            className="grid h-16 w-16 place-items-center rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
            }}
          >
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="mt-5 font-display text-[20px] leading-tight tracking-tight text-foreground">
            Success!
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            {phase === "request"
              ? "Check your email for the reset link."
              : "Your password has been reset."}
          </p>
        </div>
      </PhoneFrame>
    );
  }

  if (phase === "request") {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-14 pb-7">
          <button
            onClick={() => navigate("login")}
            className="mb-6 flex items-center gap-2 text-[13px] font-semibold text-[var(--primary)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Back to login
          </button>

          <div className="flex flex-col items-center">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
              }}
            >
              <span className="font-display text-[18px] leading-none">N</span>
            </div>
            <h2 className="mt-5 font-display text-[22px] leading-tight tracking-tight text-foreground">
              Reset your password
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Enter your email to receive a reset link
            </p>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
              <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">Email</p>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
                  type="email"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-center text-[11px] font-semibold text-red-500">{error}</p>
          )}

          <button
            onClick={handleRequestReset}
            disabled={!isRequestValid}
            className="mt-6 w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-14 pb-7">
        <div className="flex flex-col items-center">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
            }}
          >
            <span className="font-display text-[18px] leading-none">N</span>
          </div>
          <h2 className="mt-5 font-display text-[22px] leading-tight tracking-tight text-foreground">
            Create new password
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">New Password</p>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
                type={showPassword ? "text" : "password"}
              />
            </div>
            <button
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="Show password"
              type="button"
            >
              <Eye className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Confirm Password</p>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
                type={showConfirm ? "text" : "password"}
              />
            </div>
            <button
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label="Show password"
              type="button"
            >
              <Eye className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-[11px] font-semibold text-red-500">{error}</p>
        )}

        <button
          onClick={handleResetPassword}
          disabled={!isResetValid}
          className="mt-6 w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>

        <button
          onClick={() => navigate("login")}
          className="mt-3 text-center text-[12px] font-semibold text-[var(--primary)]"
        >
          Back to login
        </button>
      </div>
    </PhoneFrame>
  );
}
