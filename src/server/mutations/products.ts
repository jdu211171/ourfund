import { prisma } from "../../lib/db";
import { normalizeProductName } from "../helpers/product";
export async function handleAddTrackedProduct(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  await prisma.trackedProduct.create({
    data: {
      id: payload.id,
      householdId,
      name: payload.name,
      store: payload.store,
      category: payload.category,
      amountUsd: Number(payload.amountUsd) || 0,
      quantity: Number(payload.quantity) || 1,
      unitPriceUsd: payload.unitPriceUsd == null ? null : Number(payload.unitPriceUsd),
      purchasedAt: payload.purchasedAt,
      source: payload.source === "receipt" ? "receipt" : "manual",
    },
  });
}
