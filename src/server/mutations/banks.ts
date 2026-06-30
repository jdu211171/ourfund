import { prisma } from "../../lib/db";
export async function handleConnectSelectedBank(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  await prisma.linkedBank.create({
    data: {
      id: payload.id,
      householdId,
      name: payload.name,
      connectedAt: payload.connectedAt,
      accounts: payload.accounts,
    },
  });
}
