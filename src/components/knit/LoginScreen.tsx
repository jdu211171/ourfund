import { Mail, Lock, Eye } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

export function LoginScreen() {
  const { navigate, profile } = useAppNavigation();
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
          <h2 className="mt-5 font-display text-[26px] leading-tight tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Sign in to your household</p>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <Mail className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Email</p>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
                type="email"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Password</p>
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
        </div>

        <button
          onClick={() => setResetSent(true)}
          className="mt-3 self-end text-[11px] font-semibold text-[var(--primary)]"
        >
          {resetSent ? "Reset link sent" : "Forgot password?"}
        </button>

        <button
          onClick={() => navigate("home")}
          disabled={!email || !password}
          className="mt-5 w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          Sign in
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-[var(--muted)]" />
          or
          <span className="h-px flex-1 bg-[var(--muted)]" />
        </div>

        <button
          onClick={() => navigate("home")}
          className="w-full rounded-full bg-white py-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-soft)]"
        >
          Continue with Apple
        </button>
        <button
          onClick={() => navigate("home")}
          className="mt-2 w-full rounded-full bg-white py-3.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-soft)]"
        >
          Continue with Google
        </button>

        <p className="mt-auto text-center text-[12px] text-muted-foreground">
          New here?{" "}
          <button onClick={() => navigate("signup")} className="font-bold text-foreground">
            Create an account
          </button>
        </p>
      </div>
    </PhoneFrame>
  );
}
