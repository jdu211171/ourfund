import { Home, Wallet, Activity, User } from "lucide-react";
import { useAppNavigation } from "@/lib/navigation";

type NavKey = "home" | "wallet" | "activity" | "user";

export function BottomNav({ active }: { active?: NavKey }) {
  const { navigate } = useAppNavigation();

  const cls = (k: NavKey) =>
    `grid h-10 w-10 place-items-center rounded-xl ${
      active === k ? "text-foreground" : "text-muted-foreground"
    }`;

  return (
    <div className="absolute inset-x-0 bottom-0 z-50">
      <nav className="mx-auto flex w-full max-w-full items-center justify-around bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-10px_28px_-24px_oklch(0.18_0.04_265)] sm:rounded-b-[40px] sm:pb-6 sm:shadow-none">
        <button className={cls("home")} aria-label="Home" onClick={() => navigate("home")}>
          <Home className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <button className={cls("wallet")} aria-label="Wallet" onClick={() => navigate("wallet")}>
          <Wallet className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <button
          className={cls("activity")}
          aria-label="Activity"
          onClick={() => navigate("reports_month")}
        >
          <Activity className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <button className={cls("user")} aria-label="Profile" onClick={() => navigate("family")}>
          <User className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </nav>
    </div>
  );
}
