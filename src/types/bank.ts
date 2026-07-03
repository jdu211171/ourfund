export interface LinkedBank {
  id: string
  name: string
  connectedAt: string
  accounts: { name: string; balanceUsd: number }[]
}
