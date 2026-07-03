import { prisma } from '../../lib/db'
import { createNotificationsForUsers, getHouseholdUsers } from '../helpers/notification'
export async function handleCreateHousehold(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const inviteCode = `NEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const personalCurrency = payload.personalCurrency || user.personalCurrency || 'USD'
  const familyCurrency = payload.familyCurrency || 'UZS'
  await prisma.user.update({
    where: { id: user.id },
    data: { personalCurrency, budgetMode: 'family' }
  })
  const household = await prisma.household.create({
    data: {
      name: payload.householdName,
      inviteCode,
      familyCurrency
    }
  })
  const familyMember = await prisma.familyMember.create({
    data: {
      userId: user.id,
      householdId: household.id,
      name: payload.name || user.name,
      role: 'Admin',
      initials: payload.initials || user.initials,
      permissions: {
        "Approve children's requests": true,
        'Edit budget limits': true,
        'Add or remove members': true,
        'View private wallets': true
      }
    }
  })
  // Create the two starter wallets
  await prisma.walletAccount.create({
    data: {
      householdId: household.id,
      label: `${payload.name || user.name} · Personal`,
      sub: 'Private wallet',
      type: 'private',
      currency: personalCurrency,
      members: [familyMember.id],
      color: 'oklch(0.3 0.05 265)',
      startingBalanceUsd: 0
    }
  })
  await prisma.walletAccount.create({
    data: {
      householdId: household.id,
      label: `${payload.householdName} Shared`,
      sub: 'Shared · 0 balance',
      type: 'shared',
      currency: familyCurrency,
      members: [familyMember.id],
      color: 'oklch(0.55 0.24 265)',
      startingBalanceUsd: 0
    }
  })
  await prisma.appNotification.create({
    data: {
      userId: user.id,
      title: 'Household created',
      desc: `${household.name} is ready. Invite your family to join.`,
      time: 'now',
      group: 'Today',
      tone: 'primary',
      screen: 'family'
    }
  })
}

export async function handleAcceptInvite(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  // Make sure this user isn't already in the household
  const found = await prisma.household.findUnique({
    where: { inviteCode: payload.code.toUpperCase() }
  })
  if (!found) throw new Error('Invite code not found')

  const alreadyMember = await prisma.familyMember.findFirst({
    where: { userId: user.id, householdId: found.id }
  })
  if (alreadyMember) return // idempotent — already a member

  const personalCurrency = payload.personalCurrency || user.personalCurrency || 'USD'
  const memberName = payload.name || user.name
  const pendingMember = await prisma.familyMember.findFirst({
    where: {
      householdId: found.id,
      userId: null,
      email: { equals: user.email, mode: 'insensitive' }
    }
  })
  const role = pendingMember?.role || payload.role || 'Adult'
  const initials = payload.initials || user.initials
  const permissions = {
    "Approve children's requests": role !== 'Kid',
    'Edit budget limits': role !== 'Kid',
    'Add or remove members': role === 'Admin',
    'View private wallets': role === 'Admin' || role === 'Adult'
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { personalCurrency, budgetMode: 'family' }
  })

  const familyMember = pendingMember
    ? await prisma.familyMember.update({
        where: { id: pendingMember.id },
        data: {
          userId: user.id,
          name: memberName,
          email: user.email,
          role,
          initials,
          permissions
        }
      })
    : await prisma.familyMember.create({
        data: {
          userId: user.id,
          householdId: found.id,
          name: memberName,
          email: user.email,
          role,
          initials,
          permissions
        }
      })
  // Give the new member a personal wallet
  await prisma.walletAccount.create({
    data: {
      householdId: found.id,
      label: `${memberName} · Personal`,
      sub: 'Private wallet',
      type: 'private',
      currency: personalCurrency,
      members: [familyMember.id],
      color: 'oklch(0.3 0.05 265)',
      startingBalanceUsd: 0
    }
  })
  const householdUsers = await getHouseholdUsers(found.id)
  await createNotificationsForUsers(
    householdUsers.map(member => member.id),
    {
      title: 'New member joined',
      desc: `${memberName} joined ${found.name}.`,
      time: 'now',
      group: 'Today',
      tone: 'primary',
      screen: 'family'
    }
  )
}

export async function handleValidateInviteCode(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const found = await prisma.household.findUnique({
    where: { inviteCode: payload.code.toUpperCase() },
    include: { members: true }
  })
  if (!found) return null
  return {
    code: found.inviteCode,
    householdName: found.name,
    memberCount: found.members.length,
    role: 'Adult',
    inviter: found.members.find(m => m.role === 'Admin')?.name || 'Family Admin',
    familyCurrency: found.familyCurrency
  }
}
