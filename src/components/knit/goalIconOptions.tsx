import { Target } from "lucide-react";
import { DynamicIcon, iconNames } from "lucide-react/dynamic.mjs";
import type { IconName } from "lucide-react/dynamic.mjs";

export type GoalIconOption = {
  key: IconName;
  label: string;
};

const titleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

export const goalIconOptions: GoalIconOption[] = iconNames.map((name) => ({
  key: name,
  label: titleCase(name),
}));

const iconNameSet = new Set<string>(iconNames);
const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

export const defaultGoalIconName: IconName = iconNameSet.has("target")
  ? ("target" as IconName)
  : (iconNames[0] ?? ("target" as IconName));

export const normalizeGoalIconName = (icon?: string | null): IconName => {
  if (!icon) return defaultGoalIconName;
  const normalized = toKebabCase(icon);
  return iconNameSet.has(normalized) ? (normalized as IconName) : defaultGoalIconName;
};

export function GoalIcon({
  name,
  className,
  strokeWidth,
}: {
  name?: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <DynamicIcon
      name={normalizeGoalIconName(name)}
      fallback={() => <Target className={className} strokeWidth={strokeWidth} />}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}
