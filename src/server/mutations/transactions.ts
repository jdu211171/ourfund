import { prisma } from '../../lib/db'
import { canUseWalletAsTransferSource, canUseWalletAsTransferTarget } from '../helpers/wallet'
export async function handleAddTransaction(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  await prisma.transaction.create({
    data: {
      id: payload.id,
      householdId,
      name: payload.name,
      who: payload.who,
      usd: payload.usd,
      category: payload.category,
      wallet: payload.wallet,
      date: payload.date
    }
  })
}

export async function handleUpdateTransaction(
  payload: any,
  _user: any,
  _member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  // Authorization: verify this transaction belongs to the user's household
  const txn = await prisma.transaction.findUnique({ where: { id: payload.id } })
  if (!txn || txn.householdId !== householdId) throw new Error('Forbidden')
  await prisma.transaction.update({
    where: { id: payload.id },
    data: {
      name: payload.name,
      who: payload.who,
      usd: payload.usd,
      category: payload.category,
      wallet: payload.wallet,
      date: payload.date
    }
  })
}

export async function handleDeleteTransaction(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  // Authorization: verify this transaction belongs to the user's household
  const txn = await prisma.transaction.findUnique({ where: { id: payload.id } })
  if (!txn || txn.householdId !== householdId) throw new Error('Forbidden')

  await prisma.transaction.delete({ where: { id: payload.id } })

  // Clean up goal history entries referring to this transaction
  const goals = await prisma.goal.findMany({
    where: { householdId }
  })

  for (const goal of goals) {
    const history = Array.isArray(goal.history) ? (goal.history as any[]) : []
    const matches = history.filter(entry => entry && entry.transactionId === payload.id)
    if (matches.length > 0) {
      const amountUsd = matches.reduce((sum, entry) => sum + (Number(entry.amountUsd) || 0), 0)
      const updatedHistory = history.filter(entry => !entry || entry.transactionId !== payload.id)
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

export async function handleDeleteContributions(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  const { goalId, contributionIds, transactionIds } = payload

  if (Array.isArray(transactionIds) && transactionIds.length > 0) {
    const txns = await prisma.transaction.findMany({
      where: { id: { in: transactionIds } }
    })
    const hasUnauthorizedTxn = txns.some(t => t.householdId !== householdId)
    if (hasUnauthorizedTxn) throw new Error('Forbidden')

    const existingIds = txns.map(t => t.id)
    if (existingIds.length > 0) {
      await prisma.transaction.deleteMany({
        where: { id: { in: existingIds } }
      })
    }
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal || goal.householdId !== householdId) throw new Error('Forbidden')

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

export async function handleRecordTransfer(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  const transferTransactions = Array.isArray(payload.transactions) ? payload.transactions : []
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
    where: { householdId, label: { in: walletLabels as string[] } }
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
    !canUseWalletAsTransferSource(fromWallet, member.id, member.role) ||
    !canUseWalletAsTransferTarget(toWallet, member.role)
  ) {
    throw new Error('Forbidden')
  }

  await prisma.transaction.createMany({
    data: transferTransactions.map((txn: any) => ({
      id: txn.id,
      householdId,
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
