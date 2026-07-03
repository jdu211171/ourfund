import { prisma } from '../../lib/db'
export async function handleUpdateProfile(
  payload: any,
  user: any,
  member: any,
  _householdId: string | undefined
) {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: payload.name,
      phone: payload.phone,
      pronouns: payload.pronouns,
      initials: payload.initials
    }
  })
  // Keep the family-member row in sync with the user's display name
  if (member) {
    await prisma.familyMember.update({
      where: { id: member.id },
      data: {
        name: payload.name,
        initials: payload.initials
      }
    })
  }
}
