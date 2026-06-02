import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[var(--phone-bg)] transition-all sm:min-h-0 sm:h-[min(700px,calc(100dvh-32px))] sm:w-[340px] sm:rounded-[40px] sm:shadow-[var(--shadow-phone)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
