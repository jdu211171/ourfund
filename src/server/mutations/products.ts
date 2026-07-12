import { prisma } from '../../lib/db'
import { requireHouseholdId } from '../helpers/context'
export async function handleAddTrackedProduct(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  await prisma.trackedProduct.create({
    data: {
      id: payload.id,
      householdId: resolvedHouseholdId,
      name: payload.name,
      store: payload.store,
      category: payload.category,
      amountUsd: Number(payload.amountUsd) || 0,
      quantity: Number(payload.quantity) || 1,
      unitPriceUsd: payload.unitPriceUsd == null ? null : Number(payload.unitPriceUsd),
      purchasedAt: payload.purchasedAt,
      source: payload.source === 'receipt' ? 'receipt' : 'manual'
    }
  })
}
