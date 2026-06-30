import { TxnKind } from "./core";

export interface HistoryFilters {
  kind: TxnKind;
  member: string;
  categories: string[];
  sort: string;
  minUsd: number;
  maxUsd: number;
}
