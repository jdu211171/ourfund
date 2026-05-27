import { Users } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

export function OnboardingScreen() {
  const { navigate, setSignupHouseholdMode } = useAppNavigation();

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-12 pb-7">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-[28px] leading-none tracking-tight">
            Nest<span className="text-[var(--primary)]">.</span>
          </h2>
          <button
            onClick={() => navigate("login")}
            className="text-[12px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            Sign in
          </button>
        </header>

        <div className="relative mt-10 grid place-items-center">
          <div
            className="absolute h-56 w-56 rounded-full opacity-60 blur-2xl"
            style={{
              background: "linear-gradient(135deg, oklch(0.75 0.2 265), oklch(0.92 0.18 95))",
            }}
          />
          <div
            className="relative h-44 w-72 rotate-[-8deg] rounded-3xl p-5 text-white shadow-[var(--shadow-tile)]"
            style={{
              background: "linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.2 0.05 265))",
            }}
          >
            <div className="flex items-start justify-between">
              <span className="text-[12px] uppercase tracking-widest text-white/70">Household</span>
              <Users className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <p className="mt-5 text-[11px] text-white/60">Ready to budget</p>
            <p className="mt-1 text-[22px] font-extrabold tracking-tight">$0.00</p>
            <div className="mt-3 flex -space-x-2">
              {["YOU", "+1", "+2"].map((i) => (
                <span
                  key={i}
                  className="grid h-6 w-6 place-items-center rounded-full border-2 border-[oklch(0.2_0.05_265)] bg-[oklch(0.65_0.22_265)] text-[9px] font-bold"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <h3 className="font-display text-[28px] leading-tight tracking-tight text-foreground">
            Budget together.
            <br />
            Live easier.
          </h3>
          <p className="mx-auto mt-3 max-w-[240px] text-[12px] leading-relaxed text-muted-foreground">
            One shared place for the whole family — track spending, hit goals, stop the money
            arguments.
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          <span className="h-1.5 w-6 rounded-full bg-[var(--primary)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.88_0.02_265)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.88_0.02_265)]" />
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={() => {
              setSignupHouseholdMode("new");
              navigate("signup");
            }}
            className="w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[14px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
          >
            Create our family
          </button>
          <button
            onClick={() => {
              setSignupHouseholdMode("join");
              navigate("join_family");
            }}
            className="w-full rounded-full bg-[var(--muted)] py-4 text-[14px] font-semibold text-foreground active:scale-95 transition-transform cursor-pointer"
          >
            Join with invite code
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
