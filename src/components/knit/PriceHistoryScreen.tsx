import { useMemo, useState } from "react";
import { ArrowLeft, TrendingDown, TrendingUp, Store, Sparkles } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { PURCHASE_HISTORY, allProducts, priceHistoryFor, fmtYen } from "@/lib/buy-list-history";

export function PriceHistoryScreen() {
  const { goBack, trackedProducts } = useAppNavigation();

  const products = useMemo(() => allProducts(trackedProducts), [trackedProducts]);
  const [selected, setSelected] = useState<string>(products[0] ?? "Milk 1L");

  const records = useMemo(
    () => priceHistoryFor(selected, trackedProducts),
    [selected, trackedProducts],
  );

  const stats = useMemo(() => {
    if (!records.length) return null;
    const cheapest = records.reduce((a, b) => (a.price <= b.price ? a : b));
    const recent = records[0]; // sorted ascending by daysAgo
    const oldest = records[records.length - 1];
    const min = cheapest.price;
    const max = records.reduce((a, b) => (a.price >= b.price ? a : b)).price;
    const avg = Math.round(records.reduce((s, r) => s + r.price, 0) / records.length);
    const trend = recent.price - oldest.price; // negative = dropping
    return { cheapest, recent, min, max, avg, trend };
  }, [records]);

  const trending = useMemo(() => {
    const allProductNames = allProducts(trackedProducts);
    return allProductNames
      .map((name) => {
        const list = priceHistoryFor(name, trackedProducts);
        const recent = list[0];
        const oldest = list[list.length - 1];
        if (!recent || !oldest) return { name, delta: 0, recent: 0 };
        return { name, delta: recent.price - oldest.price, recent: recent.price };
      })
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 4);
  }, [trackedProducts]);

  const yAxis = (() => {
    if (!stats) return { min: 0, max: 100 };
    const pad = Math.max(20, (stats.max - stats.min) * 0.2);
    return { min: Math.max(0, stats.min - pad), max: stats.max + pad };
  })();

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Price history</h2>
          <span className="h-9 w-9" />
        </header>

        {/* Product picker */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Product</p>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white px-3 py-3 text-[13px] font-bold text-foreground shadow-[var(--shadow-soft)] outline-none"
          >
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Hero stat */}
        {stats && (
          <div className="mt-3 rounded-2xl bg-[var(--primary)] px-4 py-3 text-white shadow-[var(--shadow-soft)]">
            <p className="text-[10px] uppercase tracking-widest opacity-80">Cheapest right now</p>
            <p className="mt-0.5 font-display text-[26px] leading-none tracking-tight tabular-nums">
              {fmtYen(stats.cheapest.price)}
            </p>
            <p className="mt-1 text-[11px] opacity-90">
              at {stats.cheapest.shop} · {stats.cheapest.daysAgo}d ago
            </p>
            <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-white/15 px-2 py-1.5">
              {stats.trend <= 0 ? (
                <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              <p className="text-[11px] font-semibold">
                {stats.trend === 0
                  ? "Price is flat across history"
                  : `${stats.trend < 0 ? "Down" : "Up"} ${fmtYen(Math.abs(stats.trend))} vs oldest record`}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {stats && (
          <div className="mt-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Trend</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                avg {fmtYen(stats.avg)}
              </p>
            </div>
            <div className="mt-2 flex h-24 items-end gap-1">
              {[...records].reverse().map((r) => {
                const h = ((r.price - yAxis.min) / (yAxis.max - yAxis.min)) * 100;
                const isMin = r.price === stats.min;
                return (
                  <div
                    key={`${r.shop}-${r.daysAgo}`}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex h-full w-full items-end">
                      <div
                        className={`w-full rounded-md ${isMin ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
                        style={{ height: `${Math.max(8, h)}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground">{r.daysAgo}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* By shop */}
        <div className="mt-3 space-y-1.5">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            By shop
          </p>
          {records.map((r) => {
            const isMin = stats && r.price === stats.min;
            return (
              <div
                key={`${r.shop}-${r.daysAgo}`}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                  <Store className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">{r.shop}</p>
                  <p className="text-[10px] text-muted-foreground">{r.daysAgo}d ago</p>
                </div>
                <div className="text-right leading-tight">
                  <p className="text-[13px] font-bold tabular-nums text-foreground">
                    {fmtYen(r.price)}
                  </p>
                  {isMin && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary)]">
                      Best
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trending */}
        <div className="mt-4 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Watchlist
            </p>
          </div>
          <div className="mt-2 space-y-1.5">
            {trending.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelected(t.name)}
                className="flex w-full items-center justify-between rounded-xl bg-[var(--muted)] px-2.5 py-2 text-left"
              >
                <span className="text-[12px] font-semibold text-foreground">{t.name}</span>
                <span
                  className={`text-[11px] font-bold tabular-nums ${t.delta < 0 ? "text-[var(--success)]" : t.delta > 0 ? "text-[var(--danger)]" : "text-muted-foreground"}`}
                >
                  {t.delta === 0 ? "—" : `${t.delta < 0 ? "▼" : "▲"} ${fmtYen(Math.abs(t.delta))}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
