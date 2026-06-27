import { createServerFn } from '@tanstack/react-start';
import { setResponseHeaders } from '@tanstack/react-start/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { loanEntrySelect } from '@/server/helpers/notification';
import { canMemberSeeGoal, normalizeBudgetMode, normalizeReportPeriod, defaultNotificationPrefs, asRecord, normalizeHistoryFilters } from '@/server/helpers';

export const getAppDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders({
    "Cache-Control": "no-store",
    Vary: "Cookie",
  });

  const user = await getSessionUser();
  if (!user) return null;

  const member = user.householdMembers[0];
  const householdId = member?.householdId || null;

  let household = null;
  let members: any[] = [];
  let wallets: any[] = [];
  let categories: any[] = [];
  let transactions: any[] = [];
  let goals: any[] = [];
  let linkedBanks: any[] = [];
  let recurringIncome: any[] = [];
  let subscriptions: any[] = [];
  let loanEntries: any[] = [];
  let trackedProducts: any[] = [];
  let receiptScans: any[] = [];
  let pendingInvite = null;

  if (householdId) {
    household = member.household;
    members = await prisma.familyMember.findMany({ where: { householdId } });
    wallets = await prisma.walletAccount.findMany({ where: { householdId } });
    categories = await prisma.budgetCategory.findMany({ where: { householdId } });
    transactions = await prisma.transaction.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
    goals = (await prisma.goal.findMany({ where: { householdId } })).filter((goal) =>
      canMemberSeeGoal(goal.contributors, member.id),
    );
    linkedBanks = await prisma.linkedBank.findMany({ where: { householdId } });
    const scheduleItems = await prisma.scheduleItem.findMany({ where: { householdId } });
    recurringIncome = scheduleItems.filter((i) => i.type === "income");
    subscriptions = scheduleItems.filter((i) => i.type === "subscription");
    loanEntries = await prisma.loanEntry.findMany({
      where: { householdId },
      select: loanEntrySelect,
      orderBy: { createdAt: "desc" },
    });
    trackedProducts = await prisma.trackedProduct.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
    receiptScans = await prisma.receiptScan.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!householdId) {
    const pendingMember = await prisma.familyMember.findFirst({
      where: {
        userId: null,
        email: { equals: user.email, mode: "insensitive" },
      },
      include: {
        household: {
          include: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (pendingMember) {
      pendingInvite = {
        code: pendingMember.household.inviteCode,
        householdName: pendingMember.household.name,
        memberCount: pendingMember.household.members.length,
        role: pendingMember.role,
        inviter:
          pendingMember.household.members.find((m) => m.role === "Admin")?.name || "Family Admin",
        familyCurrency: pendingMember.household.familyCurrency,
        invitedEmail: user.email,
      };
    }
  }

  const notifications = await prisma.appNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    isAuthenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      pronouns: user.pronouns || "",
      initials: user.initials,
      personalCurrency: user.personalCurrency,
      budgetMode: normalizeBudgetMode(user.budgetMode),
      reportPeriod: normalizeReportPeriod(user.reportPeriod),
      notificationPrefs: {
        ...defaultNotificationPrefs,
        ...asRecord(user.notificationPrefs),
      },
      historyFilters: normalizeHistoryFilters(user.historyFilters),
      passcode: user.passcode || "",
      faceIdEnabled: user.faceIdEnabled,
      compactMoneyMode: user.compactMoneyMode,
    },
    currencies: {
      personal: user.personalCurrency,
      family: household?.familyCurrency || "UZS",
    },
    household: household
      ? {
          id: household.id,
          name: household.name,
          inviteCode: household.inviteCode,
          role: member.role,
          createdAt: household.createdAt.toLocaleDateString(),
        }
      : null,
    pendingInvite,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email || "",
      role: m.role,
      initials: m.initials,
      age: m.age || undefined,
      allowanceUsd: m.allowanceUsd || undefined,
      allowanceDay: m.allowanceDay || undefined,
      allowanceOn: m.allowanceOn,
      permissions: m.permissions as Record<string, boolean>,
    })),
    wallets: wallets.map((w) => ({
      id: w.id,
      label: w.label,
      sub: w.sub,
      type: w.type,
      currency: w.currency,
      members: w.members as string[],
      color: w.color,
      startingBalanceUsd: w.startingBalanceUsd,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      label: c.label,
      limitUsd: c.limitUsd,
      color: c.color,
      icon: c.icon,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      name: t.name,
      who: t.who,
      usd: t.usd,
      category: t.category,
      wallet: t.wallet,
      date: t.date,
    })),
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      targetUsd: g.targetUsd,
      savedUsd: g.savedUsd,
      targetDate: g.targetDate,
      icon: g.icon,
      color: g.color,
      contributors: g.contributors as string[],
      history: g.history as any[],
    })),
    linkedBanks: linkedBanks.map((b) => ({
      id: b.id,
      name: b.name,
      connectedAt: b.connectedAt,
      accounts: b.accounts as any[],
    })),
    recurringIncome: recurringIncome.map((r) => ({
      id: r.id,
      label: r.label,
      every: r.every,
      amountUsd: r.amountUsd,
      color: r.color,
      type: r.type,
    })),
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      label: s.label,
      every: s.every,
      amountUsd: s.amountUsd,
      color: s.color,
      type: s.type,
    })),
    loanEntries: loanEntries.map((entry) => ({
      id: entry.id,
      ownerMemberId: entry.ownerMemberId ?? "",
      counterpartyMemberId: entry.counterpartyMemberId,
      counterpartyName: entry.counterpartyName,
      note: entry.note,
      due: entry.due,
      amountUsd: entry.amountUsd,
      paidAmountUsd: entry.paidAmountUsd,
      direction: entry.direction,
      status: entry.status,
      createdAt: entry.createdAt.toLocaleDateString(),
    })),
    trackedProducts: trackedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      store: product.store,
      category: product.category,
      amountUsd: product.amountUsd,
      quantity: product.quantity,
      unitPriceUsd: product.unitPriceUsd,
      purchasedAt: product.purchasedAt,
      source: product.source,
      createdAt: product.createdAt.toLocaleDateString(),
    })),
    receiptScans: receiptScans.map((receipt) => ({
      id: receipt.id,
      storeName: receipt.storeName,
      purchasedAt: receipt.purchasedAt,
      currency: receipt.currency,
      totalUsd: receipt.totalUsd,
      items: receipt.items,
      rawText: receipt.rawText || undefined,
      createdAt: receipt.createdAt.toLocaleDateString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      desc: n.desc,
      time: n.time,
      group: n.group,
      tone: n.tone,
      read: n.read,
      screen: n.screen,
    })),
  };
});
