import { prisma } from '../../lib/db'
import { requireHouseholdId } from '../helpers/context'
export async function handleConnectSelectedBank(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  await prisma.linkedBank.create({
    data: {
      id: payload.id,
      householdId: resolvedHouseholdId,
      name: payload.name,
      connectedAt: payload.connectedAt,
      accounts: payload.accounts
    }
  })
}
