import { prisma } from '../../lib/db'
import { sendInviteEmail } from '../../lib/mailer'
import { isDeliverableEmail } from '../helpers/email'
export async function handleInviteMember(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  const newMember = await prisma.familyMember.create({
    data: {
      id: payload.id,
      householdId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      initials: payload.initials,
      permissions: payload.permissions
    }
  })
  // Create notification for the inviter
  await prisma.appNotification.create({
    data: {
      userId: user.id,
      title: `${payload.role} invite created`,
      desc: `Invite details are ready for ${payload.name}`,
      time: 'now',
      group: 'Today',
      tone: 'primary',
      screen: 'family'
    }
  })
  if (isDeliverableEmail(newMember.email)) {
    const household = await prisma.household.findUnique({ where: { id: householdId } })
    if (household) {
      await sendInviteEmail({
        to: newMember.email!,
        inviterName: user.name || 'Family admin',
        householdName: household.name,
        inviteCode: household.inviteCode
      })
    }
  }
}

export async function handleUpdateMember(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  // Authorization: verify this member belongs to the user's household
  const m = await prisma.familyMember.findUnique({ where: { id: payload.id } })
  if (!m || m.householdId !== householdId) throw new Error('Forbidden')
  await prisma.familyMember.update({
    where: { id: payload.id },
    data: {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      initials: payload.initials,
      age: payload.age,
      allowanceUsd: payload.allowanceUsd,
      allowanceDay: payload.allowanceDay,
      allowanceOn: payload.allowanceOn,
      permissions: payload.permissions
    }
  })
}

export async function handleRemoveMember(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  // Authorization: verify this member belongs to the user's household
  const m = await prisma.familyMember.findUnique({ where: { id: payload.id } })
  if (!m || m.householdId !== householdId) throw new Error('Forbidden')
  // Prevent removing yourself if you are the only admin
  if (m.userId === user.id) throw new Error('Cannot remove yourself')
  await prisma.familyMember.delete({ where: { id: payload.id } })
}
