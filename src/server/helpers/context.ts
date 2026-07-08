import type { Prisma } from '@prisma/client'

export type SessionUser = Prisma.UserGetPayload<{
  include: {
    householdMembers: {
      include: {
        household: true
      }
    }
  }
}>
export type SessionMember = SessionUser['householdMembers'][number]

export function getPrimaryHouseholdContext(user: SessionUser | null | undefined) {
  const member = user?.householdMembers[0]
  const householdId = member?.householdId
  return { member, householdId }
}

export function requireHouseholdId(householdId: string | undefined): string {
  if (!householdId) throw new Error('No household linked')
  return householdId
}

export function requireHouseholdMember(member: SessionMember | undefined): SessionMember {
  if (!member) throw new Error('No household linked')
  return member
}

export function assertHouseholdOwnership(resourceHouseholdId: string, householdId: string) {
  if (resourceHouseholdId !== householdId) throw new Error('Forbidden')
}
