import type { CurrencyCode, MemberRole } from './core'

export interface FamilyMember {
  id: string
  name: string
  email: string
  role: MemberRole
  initials: string
  admin?: boolean
  age?: number
  allowanceUsd?: number
  allowanceDay?: string
  allowanceOn?: boolean
  permissions: Record<string, boolean>
}

export interface Household {
  id: string
  name: string
  inviteCode: string
  role: MemberRole
  createdAt: string
}

export interface HouseholdInvite {
  code: string
  householdName: string
  memberCount: number
  role: MemberRole
  inviter: string
  familyCurrency: CurrencyCode
  invitedEmail?: string
}
