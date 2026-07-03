import {
  ArrowRightLeft,
  Briefcase,
  HandCoins,
  History,
  Landmark,
  List,
  Receipt,
  ScanLine,
  ShoppingBag,
  ShoppingCart,
  Target
} from 'lucide-react'
import { useAppNavigation } from '@/lib/navigation'
import { BottomNav } from './BottomNav'
import { PhoneFrame } from './PhoneFrame'

const quickActions = [
  { label: 'Expense', Icon: Receipt, screen: 'scan_receipt' as const },
  { label: 'Income', Icon: Briefcase, screen: 'add_income' as const },
  { label: 'Transfer', Icon: ArrowRightLeft, screen: 'transfer' as const },
  { label: 'Goal', Icon: Target, screen: 'new_goal' as const },
  { label: 'Scan', Icon: ScanLine, screen: 'scan_receipt' as const },
  { label: 'Products', Icon: ShoppingBag, screen: 'product_tracker' as const },
  { label: 'Lending', Icon: HandCoins, screen: 'lend_borrow' as const },
  { label: 'Salary Calculator', Icon: Landmark, screen: 'calc_salary' as const },
  { label: 'Buy List', Icon: ShoppingCart, screen: 'buy_list' as const },
  { label: 'Saved Lists', Icon: List, screen: 'saved_lists' as const },
  { label: 'Price History', Icon: History, screen: 'price_history' as const }
] as const

export function MoreScreen() {
  const { navigate } = useAppNavigation()

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Explore every feature</p>
            <h2 className="text-[20px] font-extrabold tracking-tight text-foreground">More</h2>
          </div>
        </header>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Quick actions
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {quickActions.map(({ label, Icon, screen }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(screen)}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3 text-center"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-bold text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </PhoneFrame>
  )
}
