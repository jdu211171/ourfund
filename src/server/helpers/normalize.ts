import { currencyMeta } from '../../lib/currency';

export const defaultNotificationPrefs = {
  "Category at 80%": true,
  "Category over budget": true,
  "Large transaction": false,
  "New member expense": true,
  "Transfer requests": true,
  "Goal contributions": false,
  "Daily digest": true,
  "Weekly report": true,
  "Bill reminders": true,
};

export const defaultHistoryFilters = {
  kind: "All",
  member: "Anyone",
  categories: [],
  sort: "Newest",
  minUsd: 0,
  maxUsd: 5000,
};

export function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export function normalizeBudgetMode(value: unknown) {
  return value === "family" ? "family" : "personal";
}

export function normalizeReportPeriod(value: unknown) {
  return value === "Week" || value === "Year" ? value : "Month";
}

export function normalizeHistoryFilters(value: unknown) {
  const filters = asRecord(value);
  const kind = ["All", "Expense", "Income", "Goals", "Transfer"].includes(String(filters.kind))
    ? String(filters.kind)
    : defaultHistoryFilters.kind;
  const sort = ["Newest", "Oldest", "Highest amount", "Lowest amount"].includes(
    String(filters.sort),
  )
    ? String(filters.sort)
    : defaultHistoryFilters.sort;
  return {
    ...defaultHistoryFilters,
    ...filters,
    kind,
    categories: Array.isArray(filters.categories) ? filters.categories : [],
    sort,
    minUsd: Number.isFinite(Number(filters.minUsd))
      ? Number(filters.minUsd)
      : defaultHistoryFilters.minUsd,
    maxUsd: Number.isFinite(Number(filters.maxUsd))
      ? Number(filters.maxUsd)
      : defaultHistoryFilters.maxUsd,
  };
}

export function normalizeCurrencyCode(value: unknown, fallback: string) {
  const upper = String(value || fallback || "JPY").toUpperCase();
  const normalized = upper === "YEN" ? "JPY" : upper;
  return normalized in currencyMeta ? normalized : fallback in currencyMeta ? fallback : "JPY";
}
