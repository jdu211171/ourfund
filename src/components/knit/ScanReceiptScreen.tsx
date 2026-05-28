import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Store,
  Tag,
} from "lucide-react";
import { useRef, useState } from "react";
import { useAppNavigation, type ReceiptScan } from "@/lib/navigation";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";

export function ScanReceiptScreen() {
  const { navigate, goBack, scanReceiptImage, saveReceiptScan } = useAppNavigation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [scan, setScan] = useState<ReceiptScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      setPreview(dataUrl);
      try {
        const result = await scanReceiptImage(dataUrl);
        setScan(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Receipt scan failed");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setLoading(false);
      setError("Could not read receipt image");
    };
    reader.readAsDataURL(file);
  };

  const detectedCount = scan?.items.length ?? 0;
  const total = scan?.totalUsd ?? 0;

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
          <h2 className="text-[17px] font-bold tracking-tight">Scan receipt</h2>
          <button
            onClick={() => {
              setPreview("");
              setScan(null);
              setError("");
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground"
            aria-label="Rescan"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 relative aspect-[4/5] overflow-hidden rounded-3xl bg-[oklch(0.18_0.04_265)] text-left"
        >
          {preview ? (
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.28_0.05_265)] to-[oklch(0.14_0.04_265)]" />
              <div className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-md bg-white px-3 py-3 shadow-2xl">
                <div className="h-2 w-20 rounded-sm bg-foreground/80" />
                <div className="mt-1.5 h-1.5 w-14 rounded-sm bg-muted-foreground/40" />
                <div className="mt-2.5 space-y-1">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex justify-between">
                      <span className="h-1 w-12 rounded-sm bg-muted-foreground/40" />
                      <span className="h-1 w-6 rounded-sm bg-foreground/70" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-sm bg-foreground/80" />
              </div>
            </>
          )}
          {[
            "top-3 left-3 border-t-2 border-l-2 rounded-tl-md",
            "top-3 right-3 border-t-2 border-r-2 rounded-tr-md",
            "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md",
            "bottom-3 right-3 border-b-2 border-r-2 rounded-br-md",
          ].map((className) => (
            <span key={className} className={`absolute h-6 w-6 border-white/90 ${className}`} />
          ))}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5">
            <Sparkles className="h-3 w-3 text-[var(--primary)]" strokeWidth={2.75} />
            <span className="text-[10px] font-bold tracking-wide text-foreground">
              {loading
                ? "Reading receipt..."
                : detectedCount
                  ? `AI detected ${detectedCount} items`
                  : "Tap to scan receipt"}
            </span>
          </div>
        </button>

        {error && (
          <div className="mt-3 rounded-2xl bg-[oklch(0.96_0.05_25)] px-3 py-2 text-[11px] font-semibold text-[var(--danger)]">
            {error}
          </div>
        )}

        {scan && (
          <>
            <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-[12px]">
                <Store className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.25} />
                <span className="font-bold text-foreground">{scan.storeName}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" strokeWidth={2.25} /> {scan.purchasedAt}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3 w-3" strokeWidth={2.25} /> {scan.currency}
                </span>
              </div>
            </div>

            <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {scan.items.map((item) => (
                <div
                  key={`${item.name}-${item.totalUsd}`}
                  className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-[var(--shadow-soft)]"
                >
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[11.5px] font-bold text-foreground">{item.name}</p>
                    <p className="text-[9.5px] text-muted-foreground">
                      {item.category} · x{item.quantity}
                    </p>
                    {item.comparison && (
                      <p
                        className="mt-0.5 text-[9px] font-semibold"
                        style={{
                          color:
                            item.comparison.trend === "up" ? "var(--danger)" : "var(--success)",
                        }}
                      >
                        {item.comparison.trend === "same"
                          ? "Same as last"
                          : `${item.comparison.deltaPct > 0 ? "+" : ""}${Math.round(
                              item.comparison.deltaPct,
                            )}% vs ${item.comparison.previousStore}`}
                      </p>
                    )}
                  </div>
                  <Money usd={item.totalUsd} size="sm" />
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-2.5">
              <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <Money usd={total} size="md" />
            </div>
          </>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--muted)] py-2.5 text-[12px] font-semibold text-foreground"
          >
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> Upload
          </button>
          <button
            disabled={!scan || loading}
            onClick={() => {
              if (!scan) return;
              saveReceiptScan(scan);
              navigate("product_tracker");
            }}
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] py-2.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />{" "}
            {scan ? `Save ${detectedCount} items` : "Scan receipt"}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
