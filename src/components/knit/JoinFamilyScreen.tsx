import { ArrowLeft, Users } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { useState } from "react";

export function JoinFamilyScreen() {
  const { navigate, goBack, validateInviteCode } = useAppNavigation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submitCode = () => {
    const invite = validateInviteCode(code);
    if (invite) {
      navigate("confirm_invite");
      return;
    }
    setError("Invalid or expired code. Double-check with your admin.");
    navigate("join_family_error");
  };

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <button
          className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors"
          aria-label="Back"
          onClick={goBack}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <div className="mt-4 flex flex-col items-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
            }}
          >
            <Users className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <h2 className="mt-4 font-display text-[24px] leading-tight tracking-tight text-foreground">
            Join a household
          </h2>
          <p className="mt-1 text-center text-[12px] text-muted-foreground">
            Enter the invitation code your family admin shared. Your role is set automatically.
          </p>
        </div>

        <div className="mt-8">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Invitation code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="Enter code"
            className="mt-2 w-full rounded-2xl bg-white px-4 py-4 text-center text-[18px] font-extrabold tracking-[0.3em] text-foreground shadow-[var(--shadow-soft)] outline-none ring-2 ring-[var(--primary)]/40 focus:ring-[var(--primary)]"
          />
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            The code determines your role and permissions.
          </p>
          {error && (
            <p className="mt-2 text-center text-[11px] font-semibold text-[var(--danger)]">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={submitCode}
          disabled={!code.trim()}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          Join
        </button>
      </div>
    </PhoneFrame>
  );
}
