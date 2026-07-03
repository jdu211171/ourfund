import type { CurrencyCode, LoanDirection, LoanStatus, WalletType } from './core'

export interface Transaction {
  id: string
  name: string
  who: string
  usd: number
  category: string
  wallet: string
  date: string
}

export interface WalletAccount {
  id: string
  label: string
  sub: string
  type: WalletType
  currency: CurrencyCode
  members: string[]
  color: string
  startingBalanceUsd: number
}

export interface BudgetCategory {
  id: string
  label: string
  limitUsd: number
  color: string
  icon: string
}

export interface ScheduleItem {
  id: string
  label: string
  every: string
  amountUsd: number
  color: string
  type: 'income' | 'subscription'
}

export interface LoanEntry {
  id: string
  ownerMemberId: string
  counterpartyMemberId?: string | null
  counterpartyName: string
  note: string
  due: string
  amountUsd: number
  paidAmountUsd: number
  direction: LoanDirection
  status: LoanStatus
  createdAt: string
}

export interface ProductEntry {
  id: string
  name: string
  store: string
  category: string
  amountUsd: number
  quantity: number
  unitPriceUsd?: number | null
  purchasedAt: string
  source: 'manual' | 'receipt'
  createdAt: string
}
