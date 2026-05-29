import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

const excludedExports = new Set([
  "Icon",
  "LucideIcon",
  "LucideIconNode",
  "LucideProps",
  "createLucideIcon",
]);

const iconEntries = Object.entries(LucideIcons).filter(([key, value]) => {
  if (excludedExports.has(key)) return false;
  if (typeof value !== "function") return false;
  return /^[A-Z]/.test(key);
});

export type GoalIconOption = {
  key: string;
  label: string;
  Icon: LucideIcon;
};

export const goalIconOptions: GoalIconOption[] = iconEntries.map(([key, Icon]) => ({
  key,
  label: key.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
  Icon: Icon as LucideIcon,
}));

const goalIconKeyByLower = goalIconOptions.reduce<Record<string, string>>((map, option) => {
  map[option.key.toLowerCase()] = option.key;
  return map;
}, {});

export const defaultGoalIconKey =
  goalIconOptions.find((option) => option.key === "Target")?.key ??
  goalIconOptions[0]?.key ??
  "Target";

export const normalizeGoalIconKey = (icon?: string | null) =>
  goalIconKeyByLower[icon?.toLowerCase() ?? ""] ?? defaultGoalIconKey;

export const goalIconMap = goalIconOptions.reduce<Record<string, LucideIcon>>((map, option) => {
  map[option.key] = option.Icon;
  map[option.key.toLowerCase()] = option.Icon;
  return map;
}, {});
