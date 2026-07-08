import { prisma } from '../../lib/db'
import { getAppBaseUrl, sendLoanCreatedEmail, sendLoanPaidEmail } from '../../lib/mailer'
import {
  assertHouseholdOwnership,
  createNotificationsForUsers,
  getHouseholdUsers,
  isDeliverableEmail,
  loanEntrySelect,
  requireHouseholdId,
  uniqueEmails
} from '../helpers'
export async function handleAddLoanEntry(
  payload: any,
  user: any,
  _member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const created = await prisma.loanEntry.create({
    select: loanEntrySelect,
    data: {
      id: payload.id,
      householdId: resolvedHouseholdId,
      ownerMemberId: payload.ownerMemberId || '',
      counterpartyMemberId: payload.counterpartyMemberId || null,
      counterpartyName: payload.counterpartyName,
      note: payload.note,
      due: payload.due,
      amountUsd: Number(payload.amountUsd) || 0,
      paidAmountUsd: Number(payload.paidAmountUsd) || 0,
      direction: payload.direction === 'borrowed' ? 'borrowed' : 'lent',
      status: ['paid', 'overdue', 'pending'].includes(payload.status) ? payload.status : 'pending'
    }
  })
  const household = await prisma.household.findUnique({ where: { id: resolvedHouseholdId } })
  const householdUsers = await getHouseholdUsers(resolvedHouseholdId)
  const summary = `${
    created.direction === 'borrowed' ? 'Borrowed from' : 'Lent to'
  } ${created.counterpartyName} · $${created.amountUsd.toFixed(2)}`
  await createNotificationsForUsers(
    householdUsers.map(member => member.id),
    {
      title: 'Loan created',
      desc: summary,
      time: 'now',
      group: 'Today',
      tone: 'primary',
      screen: 'lend_borrow'
    }
  )
  const recipients = uniqueEmails(householdUsers.map(member => member.email)).filter(
    isDeliverableEmail
  )
  if (household) {
    const linkUrl = getAppBaseUrl()
    await Promise.all(
      recipients.map(email =>
        sendLoanCreatedEmail({
          to: email,
          householdName: household.name,
          summary,
          linkUrl
        })
      )
    )
  }
}

export async function handleUpdateLoanEntry(
  payload: any,
  user: any,
  _member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const entry = await prisma.loanEntry.findUnique({
    where: { id: payload.id },
    select: loanEntrySelect
  })
  if (!entry) throw new Error('Forbidden')
  assertHouseholdOwnership(entry.householdId, resolvedHouseholdId)
  const nextStatus = ['paid', 'overdue', 'pending'].includes(payload.status)
    ? payload.status
    : 'pending'
  const updated = await prisma.loanEntry.update({
    where: { id: payload.id },
    select: loanEntrySelect,
    data: {
      ownerMemberId: payload.ownerMemberId !== undefined ? payload.ownerMemberId : undefined,
      counterpartyMemberId: payload.counterpartyMemberId || null,
      counterpartyName: payload.counterpartyName,
      note: payload.note,
      due: payload.due,
      amountUsd: payload.amountUsd !== undefined ? Number(payload.amountUsd) : undefined,
      paidAmountUsd:
        payload.paidAmountUsd !== undefined ? Number(payload.paidAmountUsd) : undefined,
      direction: payload.direction === 'borrowed' ? 'borrowed' : 'lent',
      status: nextStatus
    }
  })
  if (entry.status !== 'paid' && updated.status === 'paid') {
    const household = await prisma.household.findUnique({ where: { id: resolvedHouseholdId } })
    const householdUsers = await getHouseholdUsers(resolvedHouseholdId)
    const summary = `${
      updated.direction === 'borrowed' ? 'Borrowed from' : 'Lent to'
    } ${updated.counterpartyName} · $${updated.amountUsd.toFixed(2)}`
    await createNotificationsForUsers(
      householdUsers.map(member => member.id),
      {
        title: 'Loan marked paid',
        desc: summary,
        time: 'now',
        group: 'Today',
        tone: 'success',
        screen: 'lend_borrow'
      }
    )
    const recipients = uniqueEmails(householdUsers.map(member => member.email)).filter(
      isDeliverableEmail
    )
    if (household) {
      const linkUrl = getAppBaseUrl()
      await Promise.all(
        recipients.map(email =>
          sendLoanPaidEmail({
            to: email,
            householdName: household.name,
            summary,
            linkUrl
          })
        )
      )
    }
  }
}

export async function handleDeleteLoanEntry(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const loanToDelete = await prisma.loanEntry.findUnique({
    where: { id: payload.id },
    select: loanEntrySelect
  })
  if (!loanToDelete) throw new Error('Forbidden')
  assertHouseholdOwnership(loanToDelete.householdId, resolvedHouseholdId)
  await prisma.loanEntry.delete({ where: { id: payload.id }, select: { id: true } })
}
