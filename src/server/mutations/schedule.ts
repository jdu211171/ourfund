import { prisma } from '../../lib/db';
export async function handleAddScheduleItem(payload: any, user: any, member: any, householdId: string | undefined) {
  if (!householdId) throw new Error("No household linked");
        const item = await prisma.scheduleItem.findUnique({ where: { id: payload.id } });
        if (item && item.householdId !== householdId) throw new Error("Forbidden");
        await prisma.scheduleItem.upsert({
          where: { id: payload.id },
          update: {
            label: payload.label,
            every: payload.every,
            amountUsd: payload.amountUsd,
            color: payload.color,
            type: payload.type,
          },
          create: {
            id: payload.id,
            householdId,
            label: payload.label,
            every: payload.every,
            amountUsd: payload.amountUsd,
            color: payload.color,
            type: payload.type,
          },
        });
}

export async function handleUpdateScheduleItem(payload: any, user: any, member: any, householdId: string | undefined) {
  if (!householdId) throw new Error("No household linked");
        const item = await prisma.scheduleItem.findUnique({ where: { id: payload.id } });
        if (!item || item.householdId !== householdId) throw new Error("Forbidden");
        await prisma.scheduleItem.update({
          where: { id: payload.id },
          data: {
            label: payload.label,
            every: payload.every,
            amountUsd: Number(payload.amountUsd) || 0,
            color: payload.color,
            type: payload.type === "subscription" ? "subscription" : "income",
          },
        });
}

export async function handleRemoveScheduleItem(payload: any, user: any, member: any, householdId: string | undefined) {
  if (!householdId) throw new Error("No household linked");
        // Authorization: verify this schedule item belongs to the user's household
        const item = await prisma.scheduleItem.findUnique({ where: { id: payload.id } });
        if (!item || item.householdId !== householdId) throw new Error("Forbidden");
        await prisma.scheduleItem.delete({ where: { id: payload.id } });
}

export async function handleRemoveScheduleItems(payload: any, user: any, member: any, householdId: string | undefined) {
  if (!householdId) throw new Error("No household linked");
        const ids = payload.ids as string[];
        const items = await prisma.scheduleItem.findMany({
          where: { id: { in: ids }, householdId },
        });
        if (items.length !== ids.length) throw new Error("Forbidden");
        await prisma.scheduleItem.deleteMany({
          where: { id: { in: ids } },
        });
}
