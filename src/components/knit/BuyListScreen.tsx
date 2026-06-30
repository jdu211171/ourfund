import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { searchProductsServerFn, resolveCanonicalServerFn } from "@/fns/buy-list";
import { resolveCanonical } from "@/lib/buy-list-history";
import {
  findCheapest,
  recentPrice,
  suggestNames,
  fmtYen,
  categorize,
  type Category,
} from "@/lib/buy-list-history";

type Unit = "pcs" | "kg" | "g" | "L" | "ml" | "pack";
const UNITS: Unit[] = ["pcs", "kg", "g", "L", "ml", "pack"];

type Item = {
  id: string;
  name: string;
  qty: number;
  unit: Unit;
  done?: boolean;
};

type BuyList = {
  id: string;
  name: string;
  items: Item[];
};

const STORAGE_KEY = "nest.buylists.v1";

function loadLists(): BuyList[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BuyList[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLists(lists: BuyList[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    /* ignore */
  }
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)) as string;

const CATEGORY_ORDER: Category[] = ["Produce", "Dairy", "Meat", "Bakery", "Pantry", "Other"];

export function BuyListScreen() {
  const { goBack, trackedProducts } = useAppNavigation();
  const [lists, setLists] = useState<BuyList[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [draftName, setDraftName] = useState("");
  const [draftQty, setDraftQty] = useState<number>(1);
  const [draftUnit, setDraftUnit] = useState<Unit>("pcs");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [dbSuggestions, setDbSuggestions] = useState<any[]>([]);
  // resolvedQuery is the canonical name we actually use for history lookups.
  // It starts as the raw draft name and may be upgraded to a Gemini-resolved
  // canonical when the local synonym table has no match.
  const [resolvedQuery, setResolvedQuery] = useState("");
  // Simple in-memory cache so we never call Gemini twice for the same term.
  const canonicalCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const loaded = loadLists();
    if (loaded.length) {
      setLists(loaded);
      setActiveId(loaded[0].id);
    } else {
      const starter: BuyList = {
        id: uid(),
        name: "Weekly groceries",
        items: [
          { id: uid(), name: "Milk 1L", qty: 2, unit: "pcs" },
          { id: uid(), name: "Rice 5kg", qty: 1, unit: "pcs" },
          { id: uid(), name: "Bananas", qty: 1, unit: "kg" },
        ],
      };
      setLists([starter]);
      setActiveId(starter.id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLists(lists);
  }, [lists, hydrated]);

  const active = useMemo(() => lists.find((l) => l.id === activeId) ?? null, [lists, activeId]);

  // Debounced search + canonical resolution
  useEffect(() => {
    const raw = draftName.trim();
    if (!raw) {
      setDbSuggestions([]);
      setResolvedQuery("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Step 1: Try to resolve the canonical name locally first
        const localCanon = resolveCanonical(raw);
        const isLocallyResolved = localCanon !== raw.toLowerCase();

        // Step 2: Determine effective query for DB search and price lookups
        let effectiveQuery = isLocallyResolved ? localCanon : raw;

        // Step 3: If not locally resolved, check cache then call Gemini
        if (!isLocallyResolved) {
          const cached = canonicalCache.current.get(raw.toLowerCase());
          if (cached) {
            effectiveQuery = cached;
          } else {
            try {
              const geminiResult = await resolveCanonicalServerFn({ data: { name: raw } });
              if (geminiResult?.canonical) {
                canonicalCache.current.set(raw.toLowerCase(), geminiResult.canonical);
                effectiveQuery = geminiResult.canonical;
              }
            } catch {
              // Gemini unavailable — stick with raw query
            }
          }
        }

        setResolvedQuery(effectiveQuery);

        // Step 4: Search DB using synonym-expanded query
        const results = await searchProductsServerFn({ data: { query: effectiveQuery } });
        setDbSuggestions(results || []);
      } catch (e) {
        console.error("Error searching products:", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [draftName]);

  // Use resolvedQuery (which may be a Gemini canonical) for suggestion generation
  const suggestions = useMemo(() => {
    const dbNames = dbSuggestions.map((p) => p.name);
    const lookupTerm = resolvedQuery || draftName;
    const staticNames = suggestNames(lookupTerm);
    return Array.from(new Set([...dbNames, ...staticNames])).slice(0, 5);
  }, [dbSuggestions, resolvedQuery, draftName]);

  const createList = () => {
    const l: BuyList = {
      id: uid(),
      name: `List ${lists.length + 1}`,
      items: [],
    };
    setLists((s) => [l, ...s]);
    setActiveId(l.id);
    setListPickerOpen(false);
    setRenaming(true);
    setRenameValue(l.name);
  };

  const deleteActive = () => {
    if (!active) return;
    const remaining = lists.filter((l) => l.id !== active.id);
    setLists(remaining);
    setActiveId(remaining[0]?.id ?? null);
  };

  const commitRename = () => {
    if (!active) return;
    const next = renameValue.trim() || active.name;
    setLists((s) => s.map((l) => (l.id === active.id ? { ...l, name: next } : l)));
    setRenaming(false);
  };

  const mutateActive = (fn: (items: Item[]) => Item[]) => {
    if (!active) return;
    setLists((s) => s.map((l) => (l.id === active.id ? { ...l, items: fn(l.items) } : l)));
  };

  const addItem = () => {
    const name = draftName.trim();
    if (!name) {
      nameInputRef.current?.focus();
      return;
    }
    const item: Item = {
      id: uid(),
      name,
      qty: Math.max(0.01, Number(draftQty) || 1),
      unit: draftUnit,
    };
    mutateActive((items) => [...items, item]);
    setDraftName("");
    setDraftQty(1);
    setDraftUnit("pcs");
    setShowSuggestions(false);
    nameInputRef.current?.focus();
  };

  const updateQty = (id: string, qty: number) =>
    mutateActive((items) =>
      items.map((it) => (it.id === id ? { ...it, qty: Math.max(0.01, qty) } : it)),
    );

  const toggleDone = (id: string) =>
    mutateActive((items) => items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));

  const removeItem = (id: string) => mutateActive((items) => items.filter((it) => it.id !== id));

  // ----- Totals & savings -----
  const totals = useMemo(() => {
    if (!active) return { estTotal: 0, recentTotal: 0, remaining: 0, savings: 0, doneCount: 0 };
    let estTotal = 0; // cheapest-based
    let recentTotal = 0; // most recent price
    let remaining = 0; // cheapest of un-checked items
    let doneCount = 0;
    for (const it of active.items) {
      const cheap = findCheapest(it.name, trackedProducts);
      const recent = recentPrice(it.name, trackedProducts);
      if (cheap) estTotal += cheap.price * it.qty;
      if (recent) recentTotal += recent.price * it.qty;
      if (it.done) doneCount++;
      else if (cheap) remaining += cheap.price * it.qty;
    }
    return {
      estTotal,
      recentTotal,
      remaining,
      savings: Math.max(0, recentTotal - estTotal),
      doneCount,
    };
  }, [active, trackedProducts]);

  // Group items by category, preserving insertion order within a group
  const grouped = useMemo(() => {
    if (!active) return [] as { category: Category; items: Item[] }[];
    const buckets = new Map<Category, Item[]>();
    for (const it of active.items) {
      const c = categorize(it.name);
      if (!buckets.has(c)) buckets.set(c, []);
      buckets.get(c)!.push(it);
    }
    return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => ({
      category: c,
      items: buckets.get(c)!,
    }));
  }, [active]);

  const totalCount = active?.items.length ?? 0;

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Buy list</h2>
          <button
            onClick={createList}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] text-white"
            aria-label="New list"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
          </button>
        </header>

        {/* List switcher */}
        <div className="relative mt-4">
          <button
            onClick={() => setListPickerOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.05_265)] text-[var(--primary)]">
              <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Active list
              </p>
              {renaming && active ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenaming(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-[14px] font-bold text-foreground outline-none"
                />
              ) : (
                <p className="text-[14px] font-bold text-foreground">
                  {active?.name ?? "No list yet"}
                </p>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition ${listPickerOpen ? "rotate-180" : ""}`}
              strokeWidth={2.5}
            />
          </button>

          {listPickerOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-phone)]">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveId(l.id);
                    setListPickerOpen(false);
                    setRenaming(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold text-foreground hover:bg-[var(--muted)]"
                >
                  <span className="truncate">{l.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {l.items.length}
                    </span>
                    {activeId === l.id && <Check className="h-4 w-4 text-[var(--primary)]" />}
                  </span>
                </button>
              ))}
              <button
                onClick={createList}
                className="flex w-full items-center gap-2 border-t border-[var(--muted)] px-4 py-2.5 text-left text-[12px] font-bold text-[var(--primary)] hover:bg-[var(--muted)]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.75} />
                New list
              </button>
            </div>
          )}
        </div>

        {/* Prominent running total */}
        {active && (
          <div className="mt-3 rounded-2xl bg-[var(--primary)] px-4 py-3 text-white shadow-[var(--shadow-soft)]">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-80">Estimated total</p>
                <p className="mt-0.5 font-display text-[26px] leading-none tracking-tight tabular-nums">
                  {fmtYen(totals.estTotal)}
                </p>
              </div>
              <div className="text-right leading-tight">
                <p className="text-[10px] uppercase tracking-widest opacity-80">Left to buy</p>
                <p className="text-[14px] font-bold tabular-nums">{fmtYen(totals.remaining)}</p>
              </div>
            </div>
            {totals.savings > 0 && (
              <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-white/15 px-2 py-1.5">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                <p className="text-[11px] font-semibold">
                  Save {fmtYen(totals.savings)} by picking the cheapest shops
                </p>
              </div>
            )}
          </div>
        )}

        {/* List meta */}
        {active && (
          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[10px] text-muted-foreground">
              {totals.doneCount}/{totalCount} picked up
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setRenameValue(active.name);
                  setRenaming(true);
                }}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-[var(--muted)]"
                aria-label="Rename list"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
              <button
                onClick={deleteActive}
                className="grid h-7 w-7 place-items-center rounded-full text-[var(--danger)] hover:bg-[var(--muted)]"
                aria-label="Delete list"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        )}

        {/* Items grouped by category */}
        <div className="mt-3 flex-1 space-y-4 overflow-y-auto pb-40">
          {active && active.items.length === 0 && (
            <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                <ShoppingCart className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-[13px] font-bold text-foreground">Your cart is empty</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add your first item below — we'll suggest the cheapest shops from your history.
              </p>
            </div>
          )}

          {grouped.map((g) => (
            <section key={g.category} className="space-y-1.5">
              <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.category}
              </p>
              {g.items.map((it) => {
                const cheapest = findCheapest(it.name, trackedProducts);
                return (
                  <div
                    key={it.id}
                    className="flex items-start gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
                  >
                    <button
                      onClick={() => toggleDone(it.id)}
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${
                        it.done
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--muted)] text-transparent hover:text-muted-foreground"
                      }`}
                      aria-label={it.done ? "Mark as not picked" : "Mark as picked"}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                    <div className="flex-1 leading-tight">
                      <p
                        className={`text-[12px] font-bold transition ${
                          it.done ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {it.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {cheapest
                          ? `Cheapest: ${fmtYen(cheapest.price)} at ${cheapest.shop}`
                          : "No price history yet"}
                      </p>
                      {!it.done && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-1 py-0.5">
                          <button
                            onClick={() => updateQty(it.id, +(it.qty - 1).toFixed(2))}
                            className="grid h-5 w-5 place-items-center rounded-full bg-white text-foreground"
                            aria-label="Decrease"
                          >
                            <span className="text-[11px] font-bold leading-none">−</span>
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={it.qty}
                            onChange={(e) => updateQty(it.id, Number(e.target.value) || 0)}
                            className="w-10 bg-transparent text-center text-[11px] font-bold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="pr-1 text-[10px] font-semibold text-muted-foreground">
                            {it.unit}
                          </span>
                          <button
                            onClick={() => updateQty(it.id, +(it.qty + 1).toFixed(2))}
                            className="grid h-5 w-5 place-items-center rounded-full bg-white text-foreground"
                            aria-label="Increase"
                          >
                            <span className="text-[11px] font-bold leading-none">+</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-[var(--muted)] hover:text-[var(--danger)]"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        {/* Sticky add-item */}
        {active && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5">
            <div className="pointer-events-auto rounded-2xl bg-white p-2.5 shadow-[var(--shadow-phone)]">
              <div className="relative">
                <input
                  ref={nameInputRef}
                  value={draftName}
                  onChange={(e) => {
                    setDraftName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addItem();
                  }}
                  placeholder="Add a product…"
                  className="w-full rounded-xl bg-[var(--muted)] px-3 py-2 text-[12px] font-semibold text-foreground placeholder:text-muted-foreground outline-none"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 overflow-hidden rounded-xl bg-white shadow-[var(--shadow-phone)]">
                    {suggestions.map((s) => {
                      const c = findCheapest(s, trackedProducts);
                      return (
                        <button
                          key={s}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDraftName(s);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[var(--muted)]"
                        >
                          <span className="text-[12px] font-semibold text-foreground">{s}</span>
                          {c && (
                            <span className="text-[10px] text-muted-foreground">
                              {fmtYen(c.price)} · {c.shop}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl bg-[var(--muted)] px-2 py-1.5">
                  <button
                    onClick={() => setDraftQty((q) => Math.max(0.01, +(q - 1).toFixed(2)))}
                    className="grid h-5 w-5 place-items-center rounded-full bg-white text-foreground"
                    aria-label="Qty down"
                  >
                    <span className="text-[11px] font-bold leading-none">−</span>
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={draftQty}
                    onChange={(e) => setDraftQty(Math.max(0.01, Number(e.target.value) || 0))}
                    className="w-10 bg-transparent text-center text-[11px] font-bold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setDraftQty((q) => +(q + 1).toFixed(2))}
                    className="grid h-5 w-5 place-items-center rounded-full bg-white text-foreground"
                    aria-label="Qty up"
                  >
                    <span className="text-[11px] font-bold leading-none">+</span>
                  </button>
                </div>
                <select
                  value={draftUnit}
                  onChange={(e) => setDraftUnit(e.target.value as Unit)}
                  className="rounded-xl bg-[var(--muted)] px-2 py-2 text-[11px] font-bold text-foreground outline-none"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addItem}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[12px] font-bold text-white shadow-[var(--shadow-soft)]"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.75} />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
