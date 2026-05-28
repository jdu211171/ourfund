import { useOptionalAppNavigation } from "@/lib/navigation";
import { formatUsdAsCurrency } from "@/lib/currency";

const sizeMap = {
  sm: { primary: "text-[13px]", sub: "text-[9px]" },
  md: { primary: "text-[16px]", sub: "text-[9px]" },
  lg: { primary: "text-[22px]", sub: "text-[10px]" },
  xl: { primary: "text-[34px]", sub: "text-[11px]" },
} as const;

type Size = keyof typeof sizeMap;

function fmtUSD(usd: number) {
  const abs = Math.abs(usd);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${usd < 0 ? "-" : ""}$${s}`;
}

export function Money({
  usd,
  size = "md",
  tone = "default",
  signed = false,
  className = "",
}: {
  usd: number;
  size?: Size;
  tone?: "default" | "success" | "danger";
  signed?: boolean;
  className?: string;
}) {
  const app = useOptionalAppNavigation();
  const currency = app?.currency ?? "USD";
  const s = sizeMap[size];
  const toneClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "danger"
        ? "text-[var(--danger)]"
        : "text-foreground";

  const sign = signed ? (usd >= 0 ? "+ " : "- ") : "";
  const displayUsd = signed ? Math.abs(usd) : usd;
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className={`${s.primary} font-extrabold tracking-tight ${toneClass}`}>
        {sign}
        {formatUsdAsCurrency(displayUsd, currency)}
      </span>
      {currency !== "USD" && (
        <span className={`${s.sub} mt-1 font-medium text-muted-foreground`}>
          ≈ {sign}
          {fmtUSD(displayUsd)}
        </span>
      )}
    </span>
  );
}
