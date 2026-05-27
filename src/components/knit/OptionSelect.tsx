import type { ReactNode } from "react";
import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  label: string;
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  icon: ReactNode;
  emptyLabel?: string;
  title?: string;
};

export function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
  emptyLabel = "Select an option",
  title = label,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-[0.99] transition-all"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[oklch(0.95_0.05_265)] text-[var(--primary)]">
          {icon}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="truncate text-[14px] font-bold text-foreground">
            {selected?.label ?? emptyLabel}
          </p>
          {selected?.description && (
            <p className="truncate text-[10px] text-muted-foreground">{selected.description}</p>
          )}
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground">
          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-4 pb-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl bg-white p-3 shadow-[var(--shadow-tile)]">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                {title}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--muted)] text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
            <div className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
              {options.map((option) => {
                const selectedOption = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                      selectedOption
                        ? "bg-[var(--accent)] text-foreground"
                        : "bg-white text-foreground hover:bg-slate-50"
                    } disabled:opacity-45`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{option.label}</p>
                      {option.description && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full ${
                        selectedOption ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)]"
                      }`}
                    >
                      {selectedOption && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
              {options.length === 0 && (
                <div className="rounded-2xl bg-[var(--muted)] px-3 py-4 text-center">
                  <p className="text-[12px] font-semibold text-muted-foreground">{emptyLabel}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
