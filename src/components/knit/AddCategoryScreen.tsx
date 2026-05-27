import { ArrowLeft } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";
import { categoryColorOptions, categoryIconOptions } from "./categoryOptions";

export function AddCategoryScreen() {
  const { navigate, goBack, addCategory } = useAppNavigation();
  const [title, setTitle] = useState("");
  const [selectedIconIdx, setSelectedIconIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [limit, setLimit] = useState("0");

  const selectedIcon = categoryIconOptions[selectedIconIdx] ?? categoryIconOptions[0];
  const ActiveIcon = selectedIcon.Icon;
  const selectedColor = categoryColorOptions[selectedColorIdx] ?? categoryColorOptions[0];

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
          <h2 className="text-[17px] font-bold tracking-tight">New category</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 flex flex-col items-center">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)] transition-all duration-300"
            style={{ background: selectedColor }}
          >
            <ActiveIcon className="h-6 w-6 animate-pulse" strokeWidth={2.25} />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-3 w-40 bg-transparent text-center text-[20px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
            placeholder="Category Name"
          />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Icon
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {categoryIconOptions.map(({ key, Icon }, i) => (
            <button
              key={key}
              onClick={() => setSelectedIconIdx(i)}
              className={`grid h-12 place-items-center rounded-2xl transition-all cursor-pointer ${
                i === selectedIconIdx
                  ? "bg-[var(--primary)] text-white shadow-md scale-105"
                  : "bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-95"
              }`}
            >
              <I className="h-4 w-4" strokeWidth={2.25} />
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Color
        </p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {categoryColorOptions.map((c, i) => (
            <button
              key={c}
              onClick={() => setSelectedColorIdx(i)}
              className={`grid h-9 w-9 place-items-center rounded-full transition-all cursor-pointer active:scale-90 ${
                i === selectedColorIdx
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-[var(--canvas)] scale-105 shadow-md"
                  : "hover:scale-105"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Monthly limit
        </p>
        <div className="mt-2 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
          <div className="flex items-end gap-2">
            <span className="pb-1 text-[18px] font-bold text-muted-foreground">$</span>
            <input
              type="text"
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-24 bg-transparent text-[28px] font-extrabold tracking-tight text-foreground outline-none p-0 border-none focus:ring-0"
              placeholder="0"
            />
            <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
              per month
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            addCategory({
              label: title.trim() || "New category",
              limitUsd: parseFloat(limit || "0"),
              color: selectedColor,
              icon: selectedIcon.key,
            });
            navigate("categories");
          }}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          Create category
        </button>
      </div>
    </PhoneFrame>
  );
}
