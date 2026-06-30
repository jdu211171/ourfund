import { CurrencyCode } from "./core";

export interface ReceiptScanItem {
  name: string;
  category: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
  originalPrice?: number;
  comparison?: {
    previousStore: string;
    previousPriceUsd: number;
    deltaPct: number;
    trend: "up" | "down" | "same";
  } | null;
}

export interface ReceiptScan {
  id: string;
  storeName: string;
  purchasedAt: string;
  currency: CurrencyCode;
  totalUsd: number;
  items: ReceiptScanItem[];
  rawText?: string;
  createdAt: string;
}
