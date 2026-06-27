import { prisma } from '../../lib/db';
import { normalizeReportPeriod, normalizeHistoryFilters, defaultNotificationPrefs, asRecord } from '../helpers/normalize';
export async function handleSetBudgetMode(payload: any, user: any, member: any, householdId: string | undefined) {
  const budgetMode = payload.budgetMode === "family" && householdId ? "family" : "personal";
        await prisma.user.update({
          where: { id: user.id },
          data: { budgetMode },
        });
}

export async function handleSetReportPeriod(payload: any, user: any, member: any, householdId: string | undefined) {
  await prisma.user.update({
          where: { id: user.id },
          data: { reportPeriod: normalizeReportPeriod(payload.reportPeriod) },
        });
}

export async function handleSetNotificationPrefs(payload: any, user: any, member: any, householdId: string | undefined) {
  await prisma.user.update({
          where: { id: user.id },
          data: {
            notificationPrefs: {
              ...defaultNotificationPrefs,
              ...asRecord(payload.notificationPrefs),
            },
          },
        });
}

export async function handleSetHistoryFilters(payload: any, user: any, member: any, householdId: string | undefined) {
  await prisma.user.update({
          where: { id: user.id },
          data: { historyFilters: normalizeHistoryFilters(payload.historyFilters) },
        });
}

export async function handleSetCompactMoneyMode(payload: any, user: any, member: any, householdId: string | undefined) {
  await prisma.user.update({
          where: { id: user.id },
          data: { compactMoneyMode: Boolean(payload.compactMoneyMode) },
        });
}

export async function handleSetCurrencyForMode(payload: any, user: any, member: any, householdId: string | undefined) {
  const currency = payload.currency;
        if (payload.mode === "personal") {
          await prisma.user.update({
            where: { id: user.id },
            data: { personalCurrency: currency },
          });
          return;
        }

        if (!householdId) throw new Error("No household linked");
        await prisma.household.update({
          where: { id: householdId },
          data: { familyCurrency: currency },
        });
        await prisma.walletAccount.updateMany({
          where: { householdId, type: { not: "private" } },
          data: { currency },
        });
}

export async function handleSetPasscode(payload: any, user: any, member: any, householdId: string | undefined) {
  await prisma.user.update({
          where: { id: user.id },
          data: {
            passcode: payload.passcode,
            faceIdEnabled: payload.faceIdEnabled,
          },
        });
}
