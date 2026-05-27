import { 
  ArrowLeft, ShoppingBag, Coffee, Car, Home, Heart, Gift, Plus, Minus, 
  Utensils, Zap, Film, Activity, Plane, GraduationCap 
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

const icons: Record<string, typeof Home> = {
  home: Home,
  shopping: ShoppingBag,
  car: Car,
  coffee: Coffee,
  heart: Heart,
  gift: Gift,
  food: Utensils,
  utilities: Zap,
  entertainment: Film,
  health: Activity,
  travel: Plane,
  education: GraduationCap,
};

export function CategoryEditorScreen() {
  const { navigate, goBack, categories, updateCategoryLimit, categorySpentUsd } =
    useAppNavigation();
  const [selectedId, setSelectedId] = useState(categories[1]?.id ?? categories[0]?.id ?? "");
  const selected = categories.find((c) => c.id === selectedId) ?? categories[0];

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

        <div className="mt-5 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[13px] font-bold text-foreground">
                {selected?.label ?? "Category"}
              </p>
              <p className="text-[10px] text-muted-foreground">Monthly limit</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-full bg-[var(--muted)] px-3 py-2">
            <button
              onClick={() =>
                selected && updateCategoryLimit(selected.id, Math.max(0, selected.limitUsd - 50))
              }
              className="grid h-7 w-7 place-items-center rounded-full bg-white text-foreground shadow-[var(--shadow-soft)] active:scale-90 transition-all cursor-pointer hover:bg-slate-50"
              aria-label="Decrease"
            >
              <Minus className="h-3 w-3" strokeWidth={3} />
            </button>
            <p className="text-[18px] font-extrabold tracking-tight text-foreground">
              ${selected?.limitUsd ?? 0}
            </p>
            <button
              onClick={() => selected && updateCategoryLimit(selected.id, selected.limitUsd + 50)}
              className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary)] text-white active:scale-90 transition-all cursor-pointer hover:bg-[oklch(0.5_0.2_265)]"
              aria-label="Increase"
            >
              <Plus className="h-3 w-3" strokeWidth={3} />
            </button>
          </div>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          All categories
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {categories.map((c) => {
            const Icon = icons[c.icon] ?? ShoppingBag;
            const spent = categorySpentUsd(c.label);
            const pct =
              c.limitUsd > 0 ? Math.min(100, Math.round((spent / c.limitUsd) * 100)) : 100;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full rounded-2xl bg-white px-3 py-2.5 text-left shadow-[var(--shadow-soft)]"
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
                      ${spent.toLocaleString()} of ${c.limitUsd.toLocaleString()}
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
