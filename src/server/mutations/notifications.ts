import { prisma } from '../../lib/db';
export async function handleMarkNotificationRead(payload: any, user: any, member: any, householdId: string | undefined) {
  // Authorization: verify this notification belongs to the current user
        const notif = await prisma.appNotification.findUnique({ where: { id: payload.id } });
        if (!notif || notif.userId !== user.id) throw new Error("Forbidden");
        await prisma.appNotification.update({
          where: { id: payload.id },
          data: { read: true },
        });
}

export async function handleMarkAllNotificationsRead(payload: any, user: any, member: any, householdId: string | undefined) {
  await prisma.appNotification.updateMany({
          where: { userId: user.id },
          data: { read: true },
        });
}
