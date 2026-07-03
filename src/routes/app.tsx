import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import {
  BarChart3,
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Wallet,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { I18nProvider } from '@/components/I18nProvider'
import { FrameProvider } from '@/components/knit/PhoneFrame'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AppNavigationProvider, useAppNavigation } from '@/lib/navigation'
import { SCREENS } from '@/lib/screen-registry'

export const Route = createFileRoute('/app')({
  component: AppLayout
})

const NAV_SECTIONS: {
  title: string
  items: { slug: string; label: string; Icon: typeof Home }[]
}[] = [
  {
    title: 'Overview',
    items: [
      { slug: 'home', label: 'Dashboard', Icon: Home },
      { slug: 'analytics', label: 'Insights', Icon: BarChart3 },
      { slug: 'reports_month', label: 'Reports', Icon: Receipt }
    ]
  },
  {
    title: 'Money',
    items: [
      { slug: 'wallet', label: 'Wallets', Icon: Wallet },
      { slug: 'history_search', label: 'Transactions', Icon: Receipt },
      { slug: 'subscriptions', label: 'Subscriptions', Icon: Sparkles },
      { slug: 'new_goal', label: 'Goals', Icon: Target }
    ]
  },
  {
    title: 'Household',
    items: [
      { slug: 'family', label: 'Family', Icon: Users },
      { slug: 'alerts', label: 'Alerts', Icon: Bell },
      { slug: 'settings', label: 'Settings', Icon: Settings }
    ]
  }
]

function AppLayout() {
  return (
    <AppNavigationProvider>
      <I18nProvider>
        <AppLayoutContent />
      </I18nProvider>
    </AppNavigationProvider>
  )
}

function AppLayoutContent() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [allOpen, setAllOpen] = useState(false)

  const { isAuthReady, profile, household, members, notifications } = useAppNavigation()

  const currentSlug = location.pathname.split('/').pop() ?? 'home'

  // Force dark mode or adapt settings if needed.
  useEffect(() => {
    const root = document.documentElement
    // Default to dark mode for web shell if theme is not set, or let ThemeToggle handle it.
    if (!localStorage.getItem('theme')) {
      root.classList.add('dark')
    }
  }, [])

  if (!isAuthReady) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--background)]">
        <h2 className="font-display text-[32px] leading-none tracking-tight text-foreground">
          Nest<span className="text-[var(--primary)]">.</span>
        </h2>
        <div className="mt-6 h-8 w-8 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)]" />
      </div>
    )
  }

  const _groups = Array.from(new Set(SCREENS.map(s => s.group)))

  // Auth screens render their own full-bleed layout without the app shell.
  const isAuthScreen = [
    'login',
    'signup',
    'onboarding',
    'reset_password',
    'join_family',
    'join_family_error',
    'confirm_invite'
  ].includes(currentSlug)
  if (isAuthScreen) {
    return (
      <div className="min-h-screen w-full bg-[var(--canvas)] text-foreground flex items-center justify-center p-4">
        <FrameProvider mode="web">
          <Outlet />
        </FrameProvider>
      </div>
    )
  }

  const initials = profile?.initials ?? profile?.name?.substring(0, 2).toUpperCase() ?? 'ME'
  const householdName = household?.name ?? 'My Household'
  const memberCountText = `${members.length} member${members.length === 1 ? '' : 's'}`
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen w-full bg-[var(--canvas)] text-foreground transition-colors duration-200">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
          <div className="flex items-center gap-2.5 px-6 py-6">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-white font-display text-[15px]"
              style={{
                background: 'linear-gradient(135deg, oklch(0.7 0.2 250), oklch(0.45 0.24 265))'
              }}
            >
              N
            </span>
            <div className="leading-tight">
              <p className="font-display text-[17px] tracking-tight">Nest</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Family budget
              </p>
            </div>
          </div>

          <button className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl bg-[var(--muted)] px-3 py-2.5 text-left transition hover:opacity-90">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[oklch(0.45_0.24_265)] text-white text-[11px] font-bold">
              {initials}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[12px] font-bold">{householdName}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                Joint household · {memberCountText}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            {NAV_SECTIONS.map(sec => (
              <div key={sec.title} className="mb-5">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {sec.title}
                </p>
                <div className="space-y-0.5">
                  {sec.items.map(({ slug, label, Icon }) => {
                    const active = currentSlug === slug
                    return (
                      <Link
                        key={slug}
                        to="/app/$screen"
                        params={{ screen: slug }}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                          active
                            ? 'bg-[var(--primary)] text-white shadow-[0_8px_24px_-12px_oklch(0.55_0.24_265/0.8)]'
                            : 'text-muted-foreground hover:bg-[var(--muted)] hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                        {label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => setAllOpen(v => !v)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-[var(--muted)]"
            >
              All screens
              <ChevronDown className={`h-3.5 w-3.5 transition ${allOpen ? 'rotate-180' : ''}`} />
            </button>
            {allOpen && (
              <div className="mt-1 max-h-[280px] overflow-y-auto px-1">
                {_groups.map(g => (
                  <div key={g} className="py-1">
                    <p className="px-2 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      {g}
                    </p>
                    {SCREENS.filter(s => s.group === g).map(s => (
                      <Link
                        key={s.slug}
                        to="/app/$screen"
                        params={{ screen: s.slug }}
                        className={`block rounded-md px-2 py-1 text-[11.5px] ${
                          currentSlug === s.slug
                            ? 'bg-[var(--primary)]/20 text-foreground'
                            : 'text-muted-foreground hover:bg-[var(--muted)] hover:text-foreground'
                        }`}
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </nav>

          <div className="border-t border-[var(--border)] p-3">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-semibold text-muted-foreground hover:bg-[var(--muted)] hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Exit to mobile gallery
            </Link>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-25 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--canvas)]/85 px-6 py-4 backdrop-blur lg:px-10">
            <button
              onClick={() => setDrawerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--muted)] lg:hidden"
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search transactions, goals, members…"
                className="h-10 w-full rounded-xl bg-[var(--muted)] pl-9 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--primary)]/40 text-foreground"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/app/$screen"
                params={{ screen: 'alerts' }}
                className="relative grid h-10 w-10 place-items-center rounded-xl bg-[var(--muted)] text-foreground"
                aria-label="Alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--danger)]" />
                )}
              </Link>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.45_0.24_265)] text-[11px] font-bold text-white">
                {initials}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-hidden px-6 py-8 lg:overflow-y-auto lg:px-10 lg:py-10">
            <FrameProvider mode="web">
              <Outlet />
            </FrameProvider>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 h-full w-[280px] overflow-y-auto bg-[var(--card)] p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[18px]">Nest</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {NAV_SECTIONS.map(sec => (
              <div key={sec.title} className="mb-4">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {sec.title}
                </p>
                {sec.items.map(({ slug, label, Icon }) => (
                  <Link
                    key={slug}
                    to="/app/$screen"
                    params={{ screen: slug }}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] ${
                      currentSlug === slug
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-foreground hover:bg-[var(--muted)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                All screens
              </p>
              {_groups.map(g => (
                <div key={g} className="py-1">
                  <p className="px-2 pb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {g}
                  </p>
                  {SCREENS.filter(s => s.group === g).map(s => (
                    <Link
                      key={s.slug}
                      to="/app/$screen"
                      params={{ screen: s.slug }}
                      onClick={() => setDrawerOpen(false)}
                      className={`block rounded-md px-2 py-1 text-[11.5px] ${
                        currentSlug === s.slug
                          ? 'bg-[var(--primary)]/20 text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
