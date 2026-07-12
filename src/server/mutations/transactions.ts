import { prisma } from '../../lib/db'
import {
  assertHouseholdOwnership,
  requireHouseholdId,
  requireHouseholdMember
} from '../helpers/context'
import { canUseWalletAsTransferSource, canUseWalletAsTransferTarget } from '../helpers/wallet'
import {
  addTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
  deleteContributionsSchema,
  recordTransferSchema
} from '../validation/mutations'

// Add a single transaction row. Validates payload then creates.
export async function handleAddTransaction(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  const parsed = addTransactionSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  await prisma.transaction.create({
    data: {
      id: parsed.id,
      householdId: resolvedHouseholdId,
      name: parsed.name,
      who: parsed.who,
      usd: parsed.usd,
      category: parsed.category,
      wallet: parsed.wallet,
      date: parsed.date
    }
  })
}

// Update an existing transaction. Checks ownership before updating.
export async function handleUpdateTransaction(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  const parsed = updateTransactionSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  // Authorization: verify this transaction belongs to the user's household
  const txn = await prisma.transaction.findUnique({ where: { id: parsed.id } })
  if (!txn) throw new Error('Forbidden')
  assertHouseholdOwnership(txn.householdId, resolvedHouseholdId)
  await prisma.transaction.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      who: parsed.who,
      usd: parsed.usd,
      category: parsed.category,
      wallet: parsed.wallet,
      date: parsed.date
    }
  })
}

// Delete a transaction and remove references from goals' histories.
export async function handleDeleteTransaction(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  const parsed = deleteTransactionSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  // Authorization: verify this transaction belongs to the user's household
  const txn = await prisma.transaction.findUnique({ where: { id: parsed.id } })
  if (!txn) throw new Error('Forbidden')
  assertHouseholdOwnership(txn.householdId, resolvedHouseholdId)

  await prisma.transaction.delete({ where: { id: parsed.id } })

  // Clean up goal history entries referring to this transaction
  const goals = await prisma.goal.findMany({
    where: { householdId: resolvedHouseholdId }
  })

  for (const goal of goals) {
    const history = Array.isArray(goal.history) ? (goal.history as any[]) : []
    const matches = history.filter(entry => entry && entry.transactionId === parsed.id)
    if (matches.length > 0) {
      const amountUsd = matches.reduce((sum, entry) => sum + (Number(entry.amountUsd) || 0), 0)
      const updatedHistory = history.filter(entry => !entry || entry.transactionId !== parsed.id)
      const updatedSavedUsd = Math.max(0, goal.savedUsd - amountUsd)

      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          savedUsd: updatedSavedUsd,
          history: updatedHistory
        }
      })
    }
  }
}

// Delete contributions from a goal's history and adjust saved amount.
export async function handleDeleteContributions(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  const parsed = deleteContributionsSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const { goalId, contributionIds = [], transactionIds = [] } = parsed

  if (Array.isArray(transactionIds) && transactionIds.length > 0) {
    const txns = await prisma.transaction.findMany({
      where: { id: { in: transactionIds } }
    })
    const hasUnauthorizedTxn = txns.some(t => t.householdId !== resolvedHouseholdId)
    if (hasUnauthorizedTxn) throw new Error('Forbidden')

    const existingIds = txns.map(t => t.id)
    if (existingIds.length > 0) {
      await prisma.transaction.deleteMany({
        where: { id: { in: existingIds } }
      })
    }
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal) throw new Error('Forbidden')
  assertHouseholdOwnership(goal.householdId, resolvedHouseholdId)

  const history = Array.isArray(goal.history) ? (goal.history as any[]) : []
  const remainingHistory = history.filter(entry => {
    if (!entry) return false
    if (contributionIds.includes(entry.id)) return false
    if (entry.transactionId && transactionIds.includes(entry.transactionId)) return false
    return true
  })

  const removedEntries = history.filter(entry => {
    if (!entry) return false
    return (
      contributionIds.includes(entry.id) ||
      (entry.transactionId && transactionIds.includes(entry.transactionId))
    )
  })

  const removedSavedUsd = removedEntries.reduce(
    (sum, entry) => sum + (Number(entry.amountUsd) || 0),
    0
  )
  const updatedSavedUsd = Math.max(0, goal.savedUsd - removedSavedUsd)

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      savedUsd: updatedSavedUsd,
      history: remainingHistory
    }
  })
}

// Record a two-leg transfer between wallets. Validates balancing and permissions.
export async function handleRecordTransfer(
  payload: any,
  _user: any,
  member: any,
  householdId: string | undefined
) {
  const parsed = recordTransferSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const resolvedMember = requireHouseholdMember(member)
  const transferTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : []
  if (transferTransactions.length !== 2) {
    throw new Error('Transfer requires two transaction legs')
  }
  const amounts = transferTransactions.map((txn: any) => Number(txn.usd))
  const outgoing = amounts.filter((amount: number) => amount < 0)
  const incoming = amounts.filter((amount: number) => amount > 0)
  if (
    outgoing.length !== 1 ||
    incoming.length !== 1 ||
    Math.abs(outgoing[0] + incoming[0]) > 0.001
  ) {
    throw new Error('Transfer legs must balance')
  }
  const walletLabels = Array.from(
    new Set(transferTransactions.map((txn: any) => String(txn.wallet || '')))
  ).filter(Boolean)
  if (walletLabels.length !== 2) throw new Error('Transfer requires two wallets')
  const transferWallets = await prisma.walletAccount.findMany({
    where: { householdId: resolvedHouseholdId, label: { in: walletLabels as string[] } }
  })
  if (transferWallets.length !== walletLabels.length) throw new Error('Forbidden')

  const fromWalletLabel = String(
    transferTransactions.find((txn: any) => Number(txn.usd) < 0)?.wallet || ''
  )
  const toWalletLabel = String(
    transferTransactions.find((txn: any) => Number(txn.usd) > 0)?.wallet || ''
  )
  const fromWallet = transferWallets.find(wallet => wallet.label === fromWalletLabel)
  const toWallet = transferWallets.find(wallet => wallet.label === toWalletLabel)
  if (!fromWallet || !toWallet || fromWallet.id === toWallet.id) throw new Error('Forbidden')
  if (
    !canUseWalletAsTransferSource(fromWallet, resolvedMember.id, resolvedMember.role) ||
    !canUseWalletAsTransferTarget(toWallet, resolvedMember.role)
  ) {
    throw new Error('Forbidden')
  }

  await prisma.transaction.createMany({
    data: transferTransactions.map((txn: any) => ({
      id: txn.id,
      householdId: resolvedHouseholdId,
      name: txn.name,
      who: txn.who,
      usd: txn.usd,
      category: 'Transfer',
      wallet: txn.wallet,
      date: txn.date
    })),
    skipDuplicates: true
  })
}
