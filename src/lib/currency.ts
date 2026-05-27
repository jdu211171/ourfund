import type { CurrencyCode } from "./navigation";

export const currencyMeta: Record<CurrencyCode, { symbol: string; rate: number; suffix?: string }> =
  {
    UZS: { symbol: "", rate: 12600, suffix: " so'm" },
    USD: { symbol: "$", rate: 1 },
    EUR: { symbol: "€", rate: 0.92 },
    GBP: { symbol: "£", rate: 0.79 },
    AUD: { symbol: "$", rate: 1.52 },
    JPY: { symbol: "", rate: 159.4, suffix: "円" },
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

export function currencyInputLabel(currency: CurrencyCode) {
  const meta = currencyMeta[currency];
  return `${currency}${meta.suffix ? ` · ${meta.symbol || ""}${meta.suffix.trim()}` : ""}`;
}
