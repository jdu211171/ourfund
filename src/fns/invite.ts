import { createServerFn } from '@tanstack/react-start';
import { prisma } from '@/lib/db';

export const validateInviteCodeServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const found = await prisma.household.findUnique({
      where: { inviteCode: data.code.toUpperCase() },
      include: { members: true },
    });
    if (!found) return null;
    return {
      code: found.inviteCode,
      householdName: found.name,
      memberCount: found.members.length,
      role: "Adult",
      inviter: found.members.find((m) => m.role === "Admin")?.name || "Family Admin",
      familyCurrency: found.familyCurrency,
    };
  });
