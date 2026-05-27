import { ArrowLeft, User, Mail, Lock, Check, Users } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { signUpWithEmailServerFn } from "@/lib/server-fns";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function SignUpScreen() {
  const {
    navigate,
    goBack,
    updateProfile,
    createHousehold,
    syncDataAfterLogin,
    signupHouseholdMode,
    setSignupHouseholdMode,
    pendingInvite,
  } = useAppNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [householdMode, setHouseholdMode] = useState<"new" | "join">(signupHouseholdMode);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHouseholdMode(signupHouseholdMode);
  }, [signupHouseholdMode]);

  const createAccount = async () => {
    setError("");
    setLoading(true);
    try {
      await signUpWithEmailServerFn({ data: { email, name, passwordHash: password } });
      await syncDataAfterLogin();
      if (householdMode === "new") {
        await createHousehold({ name, email, householdName });
        navigate("home");
      } else {
        updateProfile({ name, email });
        navigate(pendingInvite ? "confirm_invite" : "join_family");
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
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

        <div className="mt-4">
          <h2 className="font-display text-[28px] leading-tight tracking-tight text-foreground">
            Create your <br /> Nest account
          </h2>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Start your family's budget in under a minute.
          </p>
        </div>

        <div className="mt-7 space-y-3">
          {[
            { Icon: User, label: "Full name", value: name, setValue: setName, type: "text" },
            { Icon: Mail, label: "Email", value: email, setValue: setEmail, type: "email" },
            {
              Icon: Lock,
              label: "Password",
              value: password,
              setValue: setPassword,
              type: "password",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]"
            >
              <f.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">{f.label}</p>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.setValue(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Household
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setHouseholdMode("new");
              setSignupHouseholdMode("new");
            }}
            className={`rounded-2xl p-3 text-left shadow-[var(--shadow-soft)] ${householdMode === "new" ? "bg-[var(--accent)]" : "bg-white"}`}
          >
            <span className="text-[12px] font-bold text-foreground">Start new</span>
            <p className="text-[10px] text-muted-foreground">Create a household</p>
          </button>
          <button
            onClick={() => {
              setHouseholdMode("join");
              setSignupHouseholdMode("join");
            }}
            className={`rounded-2xl p-3 text-left shadow-[var(--shadow-soft)] active:scale-95 transition-transform cursor-pointer ${householdMode === "join" ? "bg-[var(--accent)]" : "bg-white"}`}
          >
            <span className="text-[12px] font-bold text-foreground">Join existing</span>
            <p className="text-[10px] text-muted-foreground">Use invite code</p>
          </button>
        </div>

        {householdMode === "new" && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Household name</p>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Our household"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setAccepted((prev) => !prev)}
          className="mt-5 flex items-center gap-2 text-left text-[11px] text-muted-foreground"
        >
          <span
            className={`grid h-5 w-5 place-items-center rounded-md ${accepted ? "bg-[var(--primary)] text-white" : "bg-white"}`}
          >
            {accepted && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          I agree to the <span className="font-bold text-foreground">Terms</span> &{" "}
          <span className="font-bold text-foreground">Privacy</span>
        </button>

        {error && (
          <p className="mt-3 text-center text-[11px] font-semibold text-red-500">{error}</p>
        )}

        <button
          onClick={createAccount}
          disabled={!name || !email || !password || !accepted || loading}
          className="mt-auto w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </PhoneFrame>
  );
}
