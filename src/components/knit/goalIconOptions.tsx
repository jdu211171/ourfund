import { Target } from "lucide-react";
import { DynamicIcon, iconNames } from "lucide-react/dynamic";

export type GoalIconOption = {
  key: string;
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

const iconNameSet = new Set(iconNames);
const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

export const defaultGoalIconName = iconNameSet.has("target")
  ? "target"
  : (iconNames[0] ?? "target");

export const normalizeGoalIconName = (icon?: string | null) => {
  if (!icon) return defaultGoalIconName;
  const normalized = toKebabCase(icon);
  return iconNameSet.has(normalized) ? normalized : defaultGoalIconName;
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
      fallback={Target}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}
