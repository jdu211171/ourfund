import { describe, it, expect } from 'vitest'
import { getPrimaryHouseholdContext, requireHouseholdId, requireHouseholdMember, assertHouseholdOwnership } from './context'

describe('context helpers', () => {
  it('getPrimaryHouseholdContext returns member and householdId when present', () => {
    const user = { householdMembers: [{ id: 'm1', householdId: 'h1', household: { id: 'h1' } }] } as any
    const { member, householdId } = getPrimaryHouseholdContext(user)
    expect(member).toBeDefined()
    expect(householdId).toBe('h1')
  })

  it('requireHouseholdId throws when undefined and returns id otherwise', () => {
    expect(() => requireHouseholdId(undefined)).toThrow('No household linked')
    expect(requireHouseholdId('x')).toBe('x')
  })

  it('requireHouseholdMember throws when undefined and returns member otherwise', () => {
    expect(() => requireHouseholdMember(undefined)).toThrow('No household linked')
    const member = { id: 'm1' } as any
    expect(requireHouseholdMember(member)).toBe(member)
  })

  it('assertHouseholdOwnership throws on mismatch and passes on match', () => {
    expect(() => assertHouseholdOwnership('a', 'b')).toThrow('Forbidden')
    expect(() => assertHouseholdOwnership('a', 'a')).not.toThrow()
  })
})
