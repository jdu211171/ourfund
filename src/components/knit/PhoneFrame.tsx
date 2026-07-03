import { createContext, type ReactNode, useContext } from 'react'
import { cn } from '@/lib/utils'

type FrameMode = 'phone' | 'web'
const FrameContext = createContext<FrameMode>('phone')

export function FrameProvider({ mode, children }: { mode: FrameMode; children: ReactNode }) {
  return <FrameContext.Provider value={mode}>{children}</FrameContext.Provider>
}

export function useFrameMode() {
  return useContext(FrameContext)
}

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  const mode = useFrameMode()

  if (mode === 'web') {
    return (
      <div
        data-web-frame
        className={cn(
          'relative w-full rounded-3xl bg-[var(--phone-bg)] shadow-[var(--shadow-soft)]',
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex h-[100svh] w-full flex-col overflow-hidden bg-[var(--phone-bg)] transition-all sm:h-[min(700px,calc(100dvh-32px))] sm:w-[340px] sm:rounded-[40px] sm:shadow-[var(--shadow-phone)]',
        className
      )}
    >
      {children}
    </div>
  )
}
