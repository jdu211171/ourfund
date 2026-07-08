import { createServerFn } from '@tanstack/react-start'
import { getSessionUser } from '@/lib/auth-server'
import * as mutations from '@/server/mutations'
import { getPrimaryHouseholdContext } from '@/server/helpers'
import type { SessionUser } from '@/server/helpers'
import { z } from 'zod'

const syncMutationInputSchema = z.object({
  type: z.string().min(1),
  data: z.unknown()
})

type MutationHandler = (
  payload: unknown,
  user: SessionUser,
  member: ReturnType<typeof getPrimaryHouseholdContext>['member'],
  householdId: string | undefined
) => Promise<unknown> | unknown

const mutationHandlers: Record<string, MutationHandler> = {
  // Profile
  updateProfile: mutations.handleUpdateProfile,

  // Settings
  setBudgetMode: mutations.handleSetBudgetMode,
  setReportPeriod: mutations.handleSetReportPeriod,
  setNotificationPrefs: mutations.handleSetNotificationPrefs,
  setHistoryFilters: mutations.handleSetHistoryFilters,
  setCompactMoneyMode: mutations.handleSetCompactMoneyMode,
  setCurrencyForMode: mutations.handleSetCurrencyForMode,
  setPasscode: mutations.handleSetPasscode,

  // Household setup
  createHousehold: mutations.handleCreateHousehold,
  validateInviteCode: mutations.handleValidateInviteCode,
  acceptInvite: mutations.handleAcceptInvite,

  // Members
  inviteMember: mutations.handleInviteMember,
  updateMember: mutations.handleUpdateMember,
  removeMember: mutations.handleRemoveMember,

  // Transactions
  addTransaction: mutations.handleAddTransaction,
  updateTransaction: mutations.handleUpdateTransaction,
  deleteTransaction: mutations.handleDeleteTransaction,
  deleteContributions: mutations.handleDeleteContributions,
  recordTransfer: mutations.handleRecordTransfer,

  // Wallets
  addWallet: mutations.handleAddWallet,
  updateWallet: mutations.handleUpdateWallet,
  deleteWallet: mutations.handleDeleteWallet,

  // Categories
  addCategory: mutations.handleAddCategory,
  updateCategory: mutations.handleUpdateCategory,
  updateCategoryLimit: mutations.handleUpdateCategoryLimit,
  deleteCategory: mutations.handleDeleteCategory,

  // Goals
  addGoal: mutations.handleAddGoal,
  updateGoal: mutations.handleUpdateGoal,
  updateGoalSavings: mutations.handleUpdateGoalSavings,
  deleteGoal: mutations.handleDeleteGoal,

  // Schedule
  addScheduleItem: mutations.handleAddScheduleItem,
  updateScheduleItem: mutations.handleUpdateScheduleItem,
  removeScheduleItem: mutations.handleRemoveScheduleItem,
  removeScheduleItems: mutations.handleRemoveScheduleItems,

  // Loans
  addLoanEntry: mutations.handleAddLoanEntry,
  updateLoanEntry: mutations.handleUpdateLoanEntry,
  deleteLoanEntry: mutations.handleDeleteLoanEntry,

  // Products
  addTrackedProduct: mutations.handleAddTrackedProduct,

  // Receipts
  saveReceiptScan: mutations.handleSaveReceiptScan,

  // Notifications
  markNotificationRead: mutations.handleMarkNotificationRead,
  markAllNotificationsRead: mutations.handleMarkAllNotificationsRead,

  // Banks
  connectSelectedBank: mutations.handleConnectSelectedBank
}

export const syncMutationServerFn = createServerFn({ method: 'POST' })
  .inputValidator(d => syncMutationInputSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await getSessionUser()
    if (!user) throw new Error('Unauthorized')

    const { member, householdId } = getPrimaryHouseholdContext(user)
    const { type, data: payload } = data
    const handler = mutationHandlers[type]
    if (!handler) throw new Error('Unknown mutation type: ' + type)

    return await handler(payload, user, member, householdId)
  })
