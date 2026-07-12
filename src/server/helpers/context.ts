// Simple helpers for extracting and validating household/session info
// These helpers keep checks in one place so mutation handlers stay small.

import type { Prisma } from '@prisma/client'

// SessionUser: full user object returned by Prisma including household members
export type SessionUser = Prisma.UserGetPayload<{
  include: {
    householdMembers: {
      include: {
        household: true
      }
    }
  }
}>
// SessionMember: a single household member entry from the user
export type SessionMember = SessionUser['householdMembers'][number]

// Return the primary household member and household id from a session user
export function getPrimaryHouseholdContext(user: SessionUser | null | undefined) {
  const member = user?.householdMembers[0]
  const householdId = member?.householdId
  return { member, householdId }
}

// Ensure a householdId exists, otherwise throw a clear error
export function requireHouseholdId(householdId: string | undefined): string {
  if (!householdId) throw new Error('No household linked')
  return householdId
}

// Ensure a household member exists, otherwise throw a clear error
export function requireHouseholdMember(member: SessionMember | undefined): SessionMember {
  if (!member) throw new Error('No household linked')
  return member
}

// Check that a resource belongs to the same household; throw if not
export function assertHouseholdOwnership(resourceHouseholdId: string, householdId: string) {
  if (resourceHouseholdId !== householdId) throw new Error('Forbidden')
}
