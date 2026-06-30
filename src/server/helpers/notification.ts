import { prisma } from "../../lib/db";

export const loanEntrySelect = {
  id: true,
  householdId: true,
  ownerMemberId: true,
  counterpartyMemberId: true,
  counterpartyName: true,
  note: true,
  due: true,
  amountUsd: true,
  paidAmountUsd: true,
  direction: true,
  status: true,
  createdAt: true,
} as const;

export async function getHouseholdUsers(householdId: string) {
  return prisma.user.findMany({
    where: { householdMembers: { some: { householdId } } },
    select: { id: true, email: true, name: true },
  });
}

export async function createNotificationsForUsers(
  userIds: string[],
  data: {
    title: string;
    desc: string;
    time: string;
    group: string;
    tone: string;
    read?: boolean;
    screen: string;
  },
) {
  if (userIds.length === 0) return;
  await prisma.appNotification.createMany({
    data: userIds.map((userId) => ({
      userId,
      ...data,
    })),
  });
}
