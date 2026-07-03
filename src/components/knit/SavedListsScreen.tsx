import { ArrowLeft, ChevronRight, Copy, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { findCheapest, fmtYen } from '@/lib/buy-list-history'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

type Unit = 'pcs' | 'kg' | 'g' | 'L' | 'ml' | 'pack'
type Item = { id: string; name: string; qty: number; unit: Unit; done?: boolean }
type BuyList = { id: string; name: string; items: Item[]; updatedAt?: number }

const STORAGE_KEY = 'nest.buylists.v1'

const uid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)) as string

function loadLists(): BuyList[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BuyList[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLists(lists: BuyList[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  } catch {
    /* ignore */
  }
}

function estimateTotal(items: Item[], dbProducts: any[] = []): number {
  return items.reduce((sum, it) => {
    const c = findCheapest(it.name, dbProducts)
    return c ? sum + c.price * it.qty : sum
  }, 0)
}

function relativeTime(ts?: number): string {
  if (!ts) return 'Never edited'
  const diff = Date.now() - ts
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

export function SavedListsScreen() {
  const { goBack, trackedProducts } = useAppNavigation()
  const [lists, setLists] = useState<BuyList[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadLists()
    if (loaded.length) {
      setLists(loaded)
    } else {
      const seed: BuyList[] = [
        {
          id: uid(),
          name: 'Weekly groceries',
          updatedAt: Date.now() - 1000 * 60 * 60 * 5,
          items: [
            { id: uid(), name: 'Milk 1L', qty: 2, unit: 'pcs' },
            { id: uid(), name: 'Rice 5kg', qty: 1, unit: 'pcs' },
            { id: uid(), name: 'Bananas', qty: 1, unit: 'kg' },
            { id: uid(), name: 'Tomatoes', qty: 3, unit: 'pcs', done: true }
          ]
        },
        {
          id: uid(),
          name: 'Birthday party',
          updatedAt: Date.now() - 1000 * 60 * 60 * 28,
          items: [
            { id: uid(), name: 'Bread loaf', qty: 2, unit: 'pcs' },
            { id: uid(), name: 'Chicken breast 1kg', qty: 2, unit: 'pcs' }
          ]
        },
        {
          id: uid(),
          name: 'Pantry restock',
          updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
          items: [
            { id: uid(), name: 'Pasta 500g', qty: 4, unit: 'pcs' },
            { id: uid(), name: 'Olive oil 1L', qty: 1, unit: 'pcs' },
            { id: uid(), name: 'Coffee beans 200g', qty: 2, unit: 'pcs' }
          ]
        }
      ]
      setLists(seed)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveLists(lists)
  }, [lists, hydrated])

  const summaries = useMemo(
    () =>
      lists.map(l => {
        const done = l.items.filter(i => i.done).length
        return {
          ...l,
          total: estimateTotal(l.items, trackedProducts),
          progress: l.items.length ? done / l.items.length : 0
        }
      }),
    [lists, trackedProducts]
  )

  const totalEstimate = summaries.reduce((s, l) => s + l.total, 0)

  const newList = () => {
    const l: BuyList = {
      id: uid(),
      name: `List ${lists.length + 1}`,
      items: [],
      updatedAt: Date.now()
    }
    setLists(s => [l, ...s])
  }

  const duplicate = (id: string) => {
    const src = lists.find(l => l.id === id)
    if (!src) return
    const copy: BuyList = {
      ...src,
      id: uid(),
      name: `${src.name} copy`,
      items: src.items.map(it => ({ ...it, id: uid(), done: false })),
      updatedAt: Date.now()
    }
    setLists(s => [copy, ...s])
  }

  const remove = (id: string) => setLists(s => s.filter(l => l.id !== id))

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Saved lists</h2>
          <button
            onClick={newList}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] text-white"
            aria-label="New list"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
          </button>
        </header>

        {/* Summary */}
        <div className="mt-4 rounded-2xl bg-[var(--primary)] px-4 py-3 text-white shadow-[var(--shadow-soft)]">
          <p className="text-[10px] uppercase tracking-widest opacity-80">
            Across {summaries.length} list{summaries.length === 1 ? '' : 's'}
          </p>
          <p className="mt-0.5 font-display text-[26px] leading-none tracking-tight tabular-nums">
            {fmtYen(totalEstimate)}
          </p>
          <p className="mt-1 text-[11px] opacity-80">
            Estimated using your cheapest historical prices
          </p>
        </div>

        {/* Lists */}
        <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pb-6">
          {summaries.length === 0 && (
            <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                <ShoppingCart className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-[13px] font-bold text-foreground">No saved lists yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tap + to start your first list.
              </p>
            </div>
          )}

          {summaries.map(l => (
            <article
              key={l.id}
              className="rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[oklch(0.95_0.05_265)] text-[var(--primary)]">
                  <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-foreground">{l.name}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {l.items.length} item{l.items.length === 1 ? '' : 's'} · {fmtYen(l.total)} ·{' '}
                    {relativeTime(l.updatedAt)}
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${Math.round(l.progress * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-1">
                <button
                  onClick={() => duplicate(l.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1 text-[10px] font-bold text-foreground"
                >
                  <Copy className="h-3 w-3" strokeWidth={2.5} />
                  Duplicate
                </button>
                <button
                  onClick={() => remove(l.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1 text-[10px] font-bold text-[var(--danger)]"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2.5} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}
