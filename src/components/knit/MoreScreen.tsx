import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  Camera,
  Coins,
  CreditCard,
  Globe,
  Grid2X2,
  HandCoins,
  KeyRound,
  Landmark,
  Mail,
  Moon,
  QrCode,
  Receipt,
  ScanLine,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Users,
  Wallet,
  WifiOff,
} from "lucide-react";
import { useMemo } from "react";
import type { ScreenName } from "@/lib/navigation";
import { useAppNavigation } from "@/lib/navigation";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import todoText from "../../../TODO.md?raw";

type TodoItem = {
  section: string;
  label: string;
  status: "coming" | "testing";
};

type TodoGroup = {
  section: string;
  items: TodoItem[];
};

const DEFAULT_SECTION = "Other";
const STATUS_TESTING = /(\[testing\]|\(testing\)|\btesting\b)/i;

function parseTodo(text: string) {
  const items: TodoItem[] = [];
  let section = DEFAULT_SECTION;

  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      section = trimmed.replace(/^##\s+/, "").trim() || DEFAULT_SECTION;
      return;
    }

    const quickActions = [
      { label: "Expense", Icon: Receipt, screen: "scan_receipt" as const },
      { label: "Income", Icon: Briefcase, screen: "add_income" as const },
      { label: "Transfer", Icon: ArrowRightLeft, screen: "transfer" as const },
      { label: "Goal", Icon: Target, screen: "new_goal" as const },
      { label: "Scan", Icon: ScanLine, screen: "scan_receipt" as const },
      { label: "Products", Icon: ShoppingBag, screen: "product_tracker" as const },
      { label: "Lending", Icon: HandCoins, screen: "lend_borrow" as const },
    ] as const;
    const match = trimmed.match(/^- \[ \] (.+)$/);
    if (match) {
      const rawLabel = match[1].trim();
      const status: TodoItem["status"] = STATUS_TESTING.test(rawLabel) ? "testing" : "coming";
      const label = rawLabel.replace(STATUS_TESTING, "").replace(/\s{2,}/g, " ").trim();
      items.push({ section, label, status });
    }
  });

  return items;
}

function iconForLabel(label: string) {
  const text = label.toLowerCase();
  if (text.includes("password") || text.includes("passcode") || text.includes("pin")) {
    return KeyRound;
  }
  if (text.includes("biometric") || text.includes("face id") || text.includes("touch id")) {
    return KeyRound;
  }
  if (text.includes("invite") || text.includes("member") || text.includes("household")) {
    return Users;
  }
  if (text.includes("email")) return Mail;
  if (text.includes("qr")) return QrCode;
  if (text.includes("wallet")) return Wallet;
  if (text.includes("bank") || text.includes("plaid")) return Landmark;
  if (text.includes("transfer")) return ArrowRightLeft;
  if (text.includes("expense")) return Receipt;
  if (text.includes("income") || text.includes("salary") || text.includes("freelance")) {
    return Briefcase;
  }
  if (text.includes("receipt") || text.includes("scan") || text.includes("ocr")) {
    return ScanLine;
  }
  if (text.includes("goal")) return Target;
  if (text.includes("category")) return Tag;
  if (text.includes("notification") || text.includes("alert")) return Bell;
  if (text.includes("report") || text.includes("analytics") || text.includes("chart")) {
    return BarChart3;
  }
  if (text.includes("settings") || text.includes("profile")) return Settings;
  if (text.includes("currency") || text.includes("balance")) return Coins;
  if (text.includes("theme") || text.includes("dark") || text.includes("light")) return Moon;
  if (text.includes("language")) return Globe;
  if (text.includes("date") || text.includes("calendar") || text.includes("week")) {
    return Calendar;
  }
  if (text.includes("camera") || text.includes("photo") || text.includes("avatar")) {
    return Camera;
  }
  if (text.includes("product")) return ShoppingBag;
  if (text.includes("lend") || text.includes("borrow") || text.includes("loan")) {
    return HandCoins;
  }
  if (text.includes("delete") || text.includes("remove")) return Trash2;
  if (text.includes("offline")) return WifiOff;
  if (text.includes("error") || text.includes("bug")) return AlertCircle;
  if (text.includes("loading") || text.includes("splash")) return Sparkles;
  if (text.includes("search") || text.includes("filter") || text.includes("sort")) {
    return Search;
  }
  if (text.includes("card") || text.includes("payment")) return CreditCard;
  return Grid2X2;
}

function screenForLabel(label: string): ScreenName | null {
  const text = label.toLowerCase();
  if (text.includes("add expense")) return "add_expense";
  if (text.includes("add income")) return "add_income";
  if (text.includes("transfer")) return "transfer";
  if (text.includes("scan") && text.includes("receipt")) return "scan_receipt";
  if (text.includes("receipt")) return "receipt";
  if (text.includes("transaction history") || text.includes("history")) return "history_search";
  if (text.includes("filter") || text.includes("sort")) return "filter_sort";
  if (text.includes("wallet")) return "wallet";
  if (text.includes("category")) return "categories";
  if (text.includes("goal")) return "new_goal";
  if (text.includes("subscription") || text.includes("bill")) return "subscriptions";
  if (text.includes("recurring income")) return "recurring_income";
  if (text.includes("report")) return "reports_month";
  if (text.includes("analytics")) return "analytics";
  if (text.includes("notification")) return "alerts";
  if (text.includes("invite")) return "invite_member";
  if (text.includes("permission")) return "permissions";
  if (text.includes("allowance")) return "allowance";
  if (text.includes("settings")) return "settings";
  if (text.includes("profile")) return "family";
  if (text.includes("passcode") || text.includes("pin")) return "passcode";
  if (text.includes("currency")) return "currency";
  if (text.includes("lend") || text.includes("borrow")) return "lend_borrow";
  if (text.includes("product")) return "product_tracker";
  if (text.includes("login")) return "login";
  if (text.includes("sign up")) return "signup";
  if (text.includes("reset password")) return "reset_password";
  if (text.includes("join")) return "join_family";
  return null;
}

export function MoreScreen() {
  const { navigate } = useAppNavigation();
  const groups = useMemo(() => {
    const parsed = parseTodo(todoText);
    const grouped = parsed.reduce<Record<string, TodoItem[]>>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).map(([section, items]) => ({
      section,
      items,
    })) as TodoGroup[];
  }, []);

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Explore every feature</p>
            <h2 className="text-[20px] font-extrabold tracking-tight text-foreground">More</h2>
          </div>
        </header>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Quick actions
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {quickActions.map(({ label, Icon, screen }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(screen)}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3 text-center"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-bold text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.section}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.section}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {group.items.map((item) => {
                  const Icon = iconForLabel(item.label);
                  const screen = screenForLabel(item.label);
                  const resolvedStatus: TodoItem["status"] =
                    item.status === "testing" ? "testing" : screen ? "testing" : "coming";
                  const isTesting = resolvedStatus === "testing";
                  const isComing = resolvedStatus === "coming";
                  const canNavigate = Boolean(screen) && isTesting;
                  const badgeClass = isTesting
                    ? "bg-[oklch(0.92_0.08_95)] text-[oklch(0.62_0.16_90)]"
                    : "bg-[oklch(0.92_0.08_25)] text-[oklch(0.6_0.22_25)]";
                  const statusLabel = isTesting ? "Testing" : "Coming";
                  return (
                    <button
                      key={`${group.section}-${item.label}`}
                      type="button"
                      onClick={() => {
                        if (canNavigate && screen) navigate(screen);
                      }}
                      aria-disabled={!canNavigate}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3 text-center ${
                        canNavigate ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <span className={`absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${badgeClass}`}>
                        {statusLabel}
                      </span>
                      <div className="flex flex-col items-center gap-2 blur-[0.8px] opacity-70">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <span className="text-[10px] font-bold text-foreground">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="more" />
    </PhoneFrame>
  );
}
