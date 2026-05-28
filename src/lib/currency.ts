import type { CurrencyCode } from "./navigation";

export const currencyMeta: Record<CurrencyCode, { symbol: string; rate: number; suffix?: string }> =
  {
    UZS: { symbol: "", rate: 12600, suffix: " so'm" },
    USD: { symbol: "$", rate: 1 },
    EUR: { symbol: "€", rate: 0.92 },
    GBP: { symbol: "£", rate: 0.79 },
    AUD: { symbol: "$", rate: 1.52 },
    JPY: { symbol: "¥", rate: 159.4 },
    CHF: { symbol: "Fr ", rate: 0.89 },
    SEK: { symbol: "kr ", rate: 10.6 },
    NOK: { symbol: "kr ", rate: 10.9 },
    DKK: { symbol: "kr ", rate: 6.86 },
    MXN: { symbol: "$", rate: 17.1 },
    BRL: { symbol: "R$", rate: 5.15 },
  };

export function usdToCurrencyValue(usd: number, currency: CurrencyCode) {
  const meta = currencyMeta[currency];
  return Math.abs(usd) * meta.rate;
}

export function currencyValueToUsd(value: number, currency: CurrencyCode) {
  const meta = currencyMeta[currency];
  return value / meta.rate;
}

export function currencyFractionDigits(currency: CurrencyCode) {
  return currency === "UZS" || currency === "JPY" ? 0 : 2;
}

export function currencyAdornment(currency: CurrencyCode) {
  const meta = currencyMeta[currency];
  return {
    prefix: meta.symbol,
    suffix: meta.suffix?.trim() ?? "",
  };
}

export function formatCurrencyValue(
  value: number,
  currency: CurrencyCode,
  options: { signed?: boolean; maximumFractionDigits?: number } = {},
) {
  const meta = currencyMeta[currency];
  const signed = options.signed ?? false;
  const amount = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(amount);
  const digits = options.maximumFractionDigits ?? currencyFractionDigits(currency);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(abs);
  const sign = signed ? (amount > 0 ? "+ " : amount < 0 ? "- " : "") : amount < 0 ? "-" : "";

  return `${sign}${meta.symbol}${formatted}${meta.suffix ?? ""}`;
}

export function formatUsdAsCurrency(
  usd: number,
  currency: CurrencyCode,
  options: { signed?: boolean; maximumFractionDigits?: number } = {},
) {
  const meta = currencyMeta[currency];
  return formatCurrencyValue((Number.isFinite(usd) ? usd : 0) * meta.rate, currency, options);
}

export function currencyInputLabel(currency: CurrencyCode) {
  const meta = currencyMeta[currency];
  const display = `${meta.symbol || ""}${meta.suffix?.trim() ?? ""}` || currency;
  return `${currency} · ${display}`;
}
