import { createServerFn } from '@tanstack/react-start'
import { setResponseHeaders } from '@tanstack/react-start/server'
import { getSessionUser } from '@/lib/auth-server'
import { prisma } from '@/lib/db'
import {
  asRecord,
  canMemberSeeGoal,
  defaultNotificationPrefs,
  getPrimaryHouseholdContext,
  normalizeBudgetMode,
  serializeCategories,
  serializeGoals,
  normalizeHistoryFilters,
  normalizeReportPeriod,
  serializeLinkedBanks,
  serializeLoanEntries,
  serializeMembers,
  serializeNotifications,
  serializeReceiptScans,
  serializeScheduleItems,
  serializeTrackedProducts,
  serializeTransactions,
  serializeWallets
} from '@/server/helpers'
import { loanEntrySelect } from '@/server/helpers/notification'

export const getAppDataServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeaders({
    'Cache-Control': 'no-store',
    Vary: 'Cookie'
  })

  const user = await getSessionUser()
  if (!user) return null

  const { member, householdId } = getPrimaryHouseholdContext(user)

  let household = null
  let members: any[] = []
  let wallets: any[] = []
  let categories: any[] = []
  let transactions: any[] = []
  let goals: any[] = []
  let linkedBanks: any[] = []
  let recurringIncome: any[] = []
  let subscriptions: any[] = []
  let loanEntries: any[] = []
  let trackedProducts: any[] = []
  let receiptScans: any[] = []
  let pendingInvite = null

  if (householdId) {
    household = member.household
    members = await prisma.familyMember.findMany({ where: { householdId } })
    wallets = await prisma.walletAccount.findMany({ where: { householdId } })
    categories = await prisma.budgetCategory.findMany({ where: { householdId } })
    transactions = await prisma.transaction.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' }
    })
    goals = (await prisma.goal.findMany({ where: { householdId } })).filter(goal =>
      canMemberSeeGoal(goal.contributors, member.id)
    )
    linkedBanks = await prisma.linkedBank.findMany({ where: { householdId } })
    const scheduleItems = await prisma.scheduleItem.findMany({ where: { householdId } })
    recurringIncome = scheduleItems.filter(i => i.type === 'income')
    subscriptions = scheduleItems.filter(i => i.type === 'subscription')
    loanEntries = await prisma.loanEntry.findMany({
      where: { householdId },
      select: loanEntrySelect,
      orderBy: { createdAt: 'desc' }
    })
    trackedProducts = await prisma.trackedProduct.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' }
    })
    receiptScans = await prisma.receiptScan.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' }
    })
  }

  if (!householdId) {
    const pendingMember = await prisma.familyMember.findFirst({
      where: {
        userId: null,
        email: { equals: user.email, mode: 'insensitive' }
      },
      include: {
        household: {
          include: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (pendingMember) {
      pendingInvite = {
        code: pendingMember.household.inviteCode,
        householdName: pendingMember.household.name,
        memberCount: pendingMember.household.members.length,
        role: pendingMember.role,
        inviter:
          pendingMember.household.members.find(m => m.role === 'Admin')?.name || 'Family Admin',
        familyCurrency: pendingMember.household.familyCurrency,
        invitedEmail: user.email
      }
    }
  }

  const notifications = await prisma.appNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return {
    isAuthenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      pronouns: user.pronouns || '',
      initials: user.initials,
      personalCurrency: user.personalCurrency,
      budgetMode: normalizeBudgetMode(user.budgetMode),
      reportPeriod: normalizeReportPeriod(user.reportPeriod),
      notificationPrefs: {
        ...defaultNotificationPrefs,
        ...asRecord(user.notificationPrefs)
      },
      historyFilters: normalizeHistoryFilters(user.historyFilters),
      passcode: user.passcode || '',
      faceIdEnabled: user.faceIdEnabled,
      compactMoneyMode: user.compactMoneyMode
    },
    currencies: {
      personal: user.personalCurrency,
      family: household?.familyCurrency || 'UZS'
    },
    household: household
      ? {
          id: household.id,
          name: household.name,
          inviteCode: household.inviteCode,
          role: member.role,
          createdAt: household.createdAt.toLocaleDateString()
        }
      : null,
    pendingInvite,
    members: serializeMembers(members),
    wallets: serializeWallets(wallets),
    categories: serializeCategories(categories),
    transactions: serializeTransactions(transactions),
    goals: serializeGoals(goals),
    linkedBanks: serializeLinkedBanks(linkedBanks),
    recurringIncome: serializeScheduleItems(recurringIncome),
    subscriptions: serializeScheduleItems(subscriptions),
    loanEntries: serializeLoanEntries(loanEntries),
    trackedProducts: serializeTrackedProducts(trackedProducts),
    receiptScans: serializeReceiptScans(receiptScans),
    notifications: serializeNotifications(notifications)
  }
})
