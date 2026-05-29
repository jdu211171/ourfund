import { Mail, Lock, Eye } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAppNavigation } from "@/lib/navigation";
import { loginWithEmailServerFn, loginWithGoogleServerFn } from "@/lib/server-fns";

const GOOGLE_CLIENT_ID = "648158368972-tl49o2fco00r73tor6c4es4kqs9ash9m.apps.googleusercontent.com";
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsClient {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode: "popup";
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: "outline";
          size: "large";
          width: number;
          text: "signin_with";
          shape: "pill";
        },
      ) => void;
    };
  };
}

type GoogleWindow = Window & typeof globalThis & { google?: GoogleAccountsClient };

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function loadGsi(): Promise<GoogleAccountsClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const win = window as GoogleWindow;
  if (win.google && win.google.accounts && win.google.accounts.id) {
    return Promise.resolve(win.google);
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(win.google ?? null));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(win.google ?? null);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function LoginScreen() {
  const { navigate, profile, pendingInvite, syncDataAfterLogin } = useAppNavigation();
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await loginWithEmailServerFn({ data: { email, passwordHash: password } });
      const restored = await syncDataAfterLogin();
      if (!restored) {
        throw new Error("Sign-in completed, but the session could not be restored.");
      }
      navigate(pendingInvite ? "confirm_invite" : "home");
    } catch (err: unknown) {
      setError(errorMessage(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setError("");
      setLoading(true);
      try {
        await loginWithGoogleServerFn({ data: { credential: response.credential } });
        const restored = await syncDataAfterLogin();
        if (!restored) {
          throw new Error("Sign-in completed, but the session could not be restored.");
        }
        navigate(pendingInvite ? "confirm_invite" : "home");
      } catch (err: unknown) {
        setError(errorMessage(err, "Google sign-in failed"));
      } finally {
        setLoading(false);
      }
    },
    [navigate, pendingInvite, syncDataAfterLogin],
  );

  useEffect(() => {
    if (!googleBtnRef.current) return;
    let cancelled = false;
    loadGsi()
      .then((google) => {
        if (cancelled || !google || !googleBtnRef.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          ux_mode: "popup",
        });
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 275,
          text: "signin_with",
          shape: "pill",
        });
      })
      .catch((err) => {
        console.error("GSI Load error", err);
      });
    return () => {
      cancelled = true;
    };
  }, [handleGoogleCredential]);

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

        {error && (
          <p className="mt-3 text-center text-[11px] font-semibold text-red-500">{error}</p>
        )}

        <button
          onClick={() => setResetSent(true)}
          className="mt-3 self-end text-[11px] font-semibold text-[var(--primary)]"
        >
          {resetSent ? "Reset link sent" : "Forgot password?"}
        </button>

        <button
          onClick={handleSignIn}
          disabled={!email || !password || loading}
          className="mt-5 w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-[var(--muted)]" />
          or
          <span className="h-px flex-1 bg-[var(--muted)]" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div ref={googleBtnRef} className="flex justify-center" />
        </div>

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
