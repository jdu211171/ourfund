import { createServerFn } from '@tanstack/react-start';
import { getSessionUser } from '@/lib/auth-server';
import * as mutations from '@/server/mutations';

export const syncMutationServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { type: string; data: any }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const member = user.householdMembers[0];
    const householdId = member?.householdId;

    const { type, data: payload } = data;

    switch (type) {
      // Profile
      case "updateProfile":
        return await mutations.handleUpdateProfile(payload, user, member, householdId);

      // Settings
      case "setBudgetMode":
        return await mutations.handleSetBudgetMode(payload, user, member, householdId);
      case "setReportPeriod":
        return await mutations.handleSetReportPeriod(payload, user, member, householdId);
      case "setNotificationPrefs":
        return await mutations.handleSetNotificationPrefs(payload, user, member, householdId);
      case "setHistoryFilters":
        return await mutations.handleSetHistoryFilters(payload, user, member, householdId);
      case "setCompactMoneyMode":
        return await mutations.handleSetCompactMoneyMode(payload, user, member, householdId);
      case "setCurrencyForMode":
        return await mutations.handleSetCurrencyForMode(payload, user, member, householdId);
      case "setPasscode":
        return await mutations.handleSetPasscode(payload, user, member, householdId);

      // Household setup
      case "createHousehold":
        return await mutations.handleCreateHousehold(payload, user, member, householdId);
      case "validateInviteCode":
        return await mutations.handleValidateInviteCode(payload, user, member, householdId);
      case "acceptInvite":
        return await mutations.handleAcceptInvite(payload, user, member, householdId);

      // Members
      case "inviteMember":
        return await mutations.handleInviteMember(payload, user, member, householdId);
      case "updateMember":
        return await mutations.handleUpdateMember(payload, user, member, householdId);
      case "removeMember":
        return await mutations.handleRemoveMember(payload, user, member, householdId);

      // Transactions
      case "addTransaction":
        return await mutations.handleAddTransaction(payload, user, member, householdId);
      case "updateTransaction":
        return await mutations.handleUpdateTransaction(payload, user, member, householdId);
      case "deleteTransaction":
        return await mutations.handleDeleteTransaction(payload, user, member, householdId);
      case "deleteContributions":
        return await mutations.handleDeleteContributions(payload, user, member, householdId);
      case "recordTransfer":
        return await mutations.handleRecordTransfer(payload, user, member, householdId);

      // Wallets
      case "addWallet":
        return await mutations.handleAddWallet(payload, user, member, householdId);
      case "updateWallet":
        return await mutations.handleUpdateWallet(payload, user, member, householdId);
      case "deleteWallet":
        return await mutations.handleDeleteWallet(payload, user, member, householdId);

      // Categories
      case "addCategory":
        return await mutations.handleAddCategory(payload, user, member, householdId);
      case "updateCategory":
        return await mutations.handleUpdateCategory(payload, user, member, householdId);
      case "updateCategoryLimit":
        return await mutations.handleUpdateCategoryLimit(payload, user, member, householdId);
      case "deleteCategory":
        return await mutations.handleDeleteCategory(payload, user, member, householdId);

      // Goals
      case "addGoal":
        return await mutations.handleAddGoal(payload, user, member, householdId);
      case "updateGoal":
        return await mutations.handleUpdateGoal(payload, user, member, householdId);
      case "updateGoalSavings":
        return await mutations.handleUpdateGoalSavings(payload, user, member, householdId);
      case "deleteGoal":
        return await mutations.handleDeleteGoal(payload, user, member, householdId);

      // Schedule
      case "addScheduleItem":
        return await mutations.handleAddScheduleItem(payload, user, member, householdId);
      case "updateScheduleItem":
        return await mutations.handleUpdateScheduleItem(payload, user, member, householdId);
      case "removeScheduleItem":
        return await mutations.handleRemoveScheduleItem(payload, user, member, householdId);
      case "removeScheduleItems":
        return await mutations.handleRemoveScheduleItems(payload, user, member, householdId);

      // Loans
      case "addLoanEntry":
        return await mutations.handleAddLoanEntry(payload, user, member, householdId);
      case "updateLoanEntry":
        return await mutations.handleUpdateLoanEntry(payload, user, member, householdId);
      case "deleteLoanEntry":
        return await mutations.handleDeleteLoanEntry(payload, user, member, householdId);

      // Products
      case "addTrackedProduct":
        return await mutations.handleAddTrackedProduct(payload, user, member, householdId);

      // Receipts
      case "saveReceiptScan":
        return await mutations.handleSaveReceiptScan(payload, user, member, householdId);

      // Notifications
      case "markNotificationRead":
        return await mutations.handleMarkNotificationRead(payload, user, member, householdId);
      case "markAllNotificationsRead":
        return await mutations.handleMarkAllNotificationsRead(payload, user, member, householdId);

      // Banks
      case "connectSelectedBank":
        return await mutations.handleConnectSelectedBank(payload, user, member, householdId);

      default:
        throw new Error("Unknown mutation type: " + type);
    }
  });
