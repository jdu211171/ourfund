import {
  ArrowLeft,
  Camera,
  Coffee,
  Plus,
  Search,
  Shirt,
  ShoppingBag,
  Smartphone,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { currencyAdornment, currencyValueToUsd, formatUsdAsCurrency } from "@/lib/currency";
import { useAppNavigation, type ProductEntry } from "@/lib/navigation";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";

const fallbackCategories = ["All", "Groceries", "Bills", "Electronics", "Dining", "Clothing"];

function normalizedName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "");
}

function ProductIcon({ category }: { category: string }) {
  const lower = category.toLowerCase();
  const Icon = lower.includes("elect")
    ? Smartphone
    : lower.includes("bill")
      ? Zap
      : lower.includes("dining") || lower.includes("coffee")
        ? Coffee
        : lower.includes("cloth")
          ? Shirt
          : ShoppingBag;
  return <Icon className="h-4 w-4" strokeWidth={2.25} />;
}

export function ProductTrackerScreen() {
  const { navigate, goBack, trackedProducts, currency, addTrackedProduct } = useAppNavigation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [store, setStore] = useState("");
  const [amount, setAmount] = useState("0");
  const [manualCategory, setManualCategory] = useState("Groceries");
  const { prefix, suffix } = currencyAdornment(currency);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set([
          ...fallbackCategories.filter((item) => item !== "All"),
          ...trackedProducts.map((product) => product.category),
        ]),
      ),
    ],
    [trackedProducts],
  );
  const visibleProducts = trackedProducts.filter((product) => {
    const text = `${product.name} ${product.store} ${product.category}`.toLowerCase();
    if (category !== "All" && product.category !== category) return false;
    return text.includes(query.trim().toLowerCase());
  });
  const monthTotal = trackedProducts.reduce((sum, product) => sum + product.amountUsd, 0);
  const storeCount = new Set(trackedProducts.map((product) => product.store)).size;

  const saveManualProduct = () => {
    const amountUsd = currencyValueToUsd(parseFloat(amount || "0"), currency);
    if (!name.trim() || amountUsd <= 0) return;
    addTrackedProduct({
      name: name.trim(),
      store: store.trim() || "Manual entry",
      category: manualCategory,
      amountUsd,
      quantity: 1,
      unitPriceUsd: amountUsd,
      purchasedAt: "today",
      source: "manual",
    });
    setName("");
    setStore("");
    setAmount("0");
    setShowForm(false);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Products</h2>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] text-white"
            aria-label="Log product"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
          </button>
        </header>

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            This month · {trackedProducts.length} items
          </p>
          <div className="mt-1">
            <Money usd={monthTotal} size="xl" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tracking price history across {storeCount} stores
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate("scan_receipt")}
            className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
              <Camera className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span>
              <span className="block text-[11px] font-bold text-foreground">Scan receipt</span>
              <span className="block text-[10px] text-muted-foreground">Add many items</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.96_0.04_145)] text-[var(--success)]">
              <ShoppingBag className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span>
              <span className="block text-[11px] font-bold text-foreground">Manual item</span>
              <span className="block text-[10px] text-muted-foreground">Track one price</span>
            </span>
          </button>
        </div>

        {showForm && (
          <div className="mt-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[12px] font-semibold outline-none"
              placeholder="Product name"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={store}
                onChange={(event) => setStore(event.target.value)}
                className="min-w-0 rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[12px] font-semibold outline-none"
                placeholder="Store"
              />
              <div className="flex items-center gap-1 rounded-2xl bg-[var(--muted)] px-3 py-2.5">
                {prefix && (
                  <span className="text-[12px] font-bold text-muted-foreground">{prefix}</span>
                )}
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  className="min-w-0 flex-1 bg-transparent text-[13px] font-extrabold outline-none"
                  placeholder="0"
                />
                {suffix && (
                  <span className="text-[10px] font-bold text-muted-foreground">{suffix}</span>
                )}
              </div>
            </div>
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {fallbackCategories
                .filter((item) => item !== "All")
                .map((item) => (
                  <button
                    key={item}
                    onClick={() => setManualCategory(item)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                      item === manualCategory
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--muted)] text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
            </div>
            <button
              type="button"
              onClick={saveManualProduct}
              className="mt-3 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white"
            >
              Save product
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
            placeholder="Search products or stores..."
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                item === category
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {visibleProducts.map((product, index) => (
            <ProductRow
              key={product.id}
              product={product}
              currency={currency}
              previous={trackedProducts
                .slice(trackedProducts.findIndex((item) => item.id === product.id) + 1)
                .find((item) => normalizedName(item.name) === normalizedName(product.name))}
            />
          ))}
          {visibleProducts.length === 0 && (
            <button
              onClick={() => navigate("scan_receipt")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No products yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Scan a receipt or add a product manually.
              </p>
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function ProductRow({
  product,
  previous,
  currency,
}: {
  product: ProductEntry;
  previous?: ProductEntry;
  currency: Parameters<typeof formatUsdAsCurrency>[1];
}) {
  const currentUnit = product.unitPriceUsd ?? product.amountUsd / Math.max(product.quantity, 1);
  const previousUnit =
    previous?.unitPriceUsd ?? (previous ? previous.amountUsd / Math.max(previous.quantity, 1) : 0);
  const delta = previousUnit > 0 ? ((currentUnit - previousUnit) / previousUnit) * 100 : 0;
  const trend = Math.abs(delta) < 1 ? "same" : delta > 0 ? "up" : "down";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
        <ProductIcon category={product.category} />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[12px] font-bold text-foreground">{product.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {product.store} · {product.category} · {product.purchasedAt}
        </p>
        {previous && (
          <p className="mt-0.5 text-[9px] text-muted-foreground">
            Last: {formatUsdAsCurrency(previousUnit, currency)} at {previous.store}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <Money usd={product.amountUsd} size="sm" />
        {previous && (
          <span
            className="text-[9px] font-bold"
            style={{ color: trend === "up" ? "var(--danger)" : "var(--success)" }}
          >
            {trend === "same" ? "same" : `${delta > 0 ? "+" : ""}${Math.round(delta)}%`} vs last
          </span>
        )}
      </div>
    </div>
  );
}
