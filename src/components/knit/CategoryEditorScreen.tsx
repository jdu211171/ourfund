import { ArrowLeft, Check, Plus, Save, ShoppingBag, Trash2 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useEffect, useState } from "react";
import { useAppNavigation } from "@/lib/navigation";
import { categoryColorOptions, categoryIconMap, categoryIconOptions } from "./categoryOptions";
import {
  currencyAdornment,
  currencyValueToUsd,
  formatUsdAsCurrency,
  usdToCurrencyValue,
} from "@/lib/currency";

export function CategoryEditorScreen() {
  const {
    navigate,
    goBack,
    currency,
    categories,
    updateCategory,
    deleteCategory,
    categorySpentUsd,
  } = useAppNavigation();
  const [selectedId, setSelectedId] = useState(categories[1]?.id ?? categories[0]?.id ?? "");
  const selected = categories.find((c) => c.id === selectedId) ?? categories[0];
  const [draftLabel, setDraftLabel] = useState(selected?.label ?? "");
  const [draftLimit, setDraftLimit] = useState(
    String(Math.round(usdToCurrencyValue(selected?.limitUsd ?? 0, currency))),
  );
  const [draftIcon, setDraftIcon] = useState(selected?.icon ?? categoryIconOptions[0].key);
  const [draftColor, setDraftColor] = useState(selected?.color ?? categoryColorOptions[0]);
  const SelectedIcon = categoryIconMap[draftIcon] ?? ShoppingBag;
  const { prefix, suffix } = currencyAdornment(currency);

  useEffect(() => {
    setDraftLabel(selected?.label ?? "");
    setDraftLimit(String(Math.round(usdToCurrencyValue(selected?.limitUsd ?? 0, currency))));
    setDraftIcon(selected?.icon ?? categoryIconOptions[0].key);
    setDraftColor(selected?.color ?? categoryColorOptions[0]);
  }, [currency, selected]);

  const saveSelected = () => {
    if (!selected) return;
    updateCategory(selected.id, {
      label: draftLabel.trim() || "Category",
      limitUsd: currencyValueToUsd(parseFloat(draftLimit || "0"), currency),
      icon: draftIcon,
      color: draftColor,
    });
  };

  const deleteSelected = () => {
    if (!selected) return;
    const nextCategory = categories.find((category) => category.id !== selected.id);
    deleteCategory(selected.id);
    setSelectedId(nextCategory?.id ?? "");
  };

  useEffect(() => {
    if (!selectedId && categories[0]) setSelectedId(categories[0].id);
  }, [categories, selectedId]);

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Categories</h2>
          <button
            onClick={() => navigate("new_category")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
            aria-label="Add category"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Tap + to create. Tap a category below to edit, then save changes or delete.
        </p>

        <div className="mt-5 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
              style={{ background: draftColor }}
            >
              <SelectedIcon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 leading-tight">
              <input
                type="text"
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                className="w-full bg-transparent text-[13px] font-bold text-foreground outline-none"
                placeholder="Category"
              />
              <p className="text-[10px] text-muted-foreground">Monthly limit</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[var(--muted)] px-3 py-2">
            {prefix && (
              <span className="text-[16px] font-bold text-muted-foreground">{prefix}</span>
            )}
            <input
              type="text"
              value={draftLimit}
              onChange={(event) => setDraftLimit(event.target.value.replace(/[^0-9.]/g, ""))}
              className="w-24 bg-transparent text-[20px] font-extrabold tracking-tight text-foreground outline-none"
            />
            {suffix && (
              <span className="text-[11px] font-bold text-muted-foreground">{suffix}</span>
            )}
            <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
              per month
            </span>
          </div>

          <div className="mt-3 grid max-h-24 grid-cols-6 gap-1.5 overflow-y-auto pr-1">
            {categoryIconOptions.map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDraftIcon(key)}
                className={`grid h-8 place-items-center rounded-xl ${
                  draftIcon === key ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {categoryColorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDraftColor(color)}
                className={`grid h-7 place-items-center rounded-full ${
                  draftColor === color ? "ring-2 ring-foreground ring-offset-2" : ""
                }`}
                style={{ background: color }}
              >
                {draftColor === color && (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={saveSelected}
              disabled={!selected}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-3 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" strokeWidth={2.25} />
              Save changes
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selected}
              className="flex items-center justify-center gap-2 rounded-full bg-[oklch(0.96_0.04_30)] py-3 text-[12px] font-semibold text-[var(--danger)] disabled:opacity-50"
              aria-label="Delete category"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              Delete
            </button>
          </div>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          All categories
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">Tap a category to select it.</p>

        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
          {categories.map((c) => {
            const Icon = categoryIconMap[c.icon] ?? ShoppingBag;
            const spent = categorySpentUsd(c.label);
            const pct =
              c.limitUsd > 0 ? Math.min(100, Math.round((spent / c.limitUsd) * 100)) : 100;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-2xl px-3 py-2.5 text-left shadow-[var(--shadow-soft)] ${
                  selectedId === c.id
                    ? "bg-[var(--accent)] ring-2 ring-[var(--primary)]"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-xl text-white"
                    style={{ background: c.color }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 leading-tight">
                    <p className="text-[12px] font-bold text-foreground">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatUsdAsCurrency(spent, currency)} of{" "}
                      {formatUsdAsCurrency(c.limitUsd, currency)}
                    </p>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground">{pct}%</p>
                </div>
              </button>
            );
          })}
          {categories.length === 0 && (
            <button
              onClick={() => navigate("new_category")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No categories yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add your first spending limit.
              </p>
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
