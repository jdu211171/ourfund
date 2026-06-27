export function canMemberSeeGoal(contributors: unknown, memberId: string | null) {
  if (!memberId || !Array.isArray(contributors) || contributors.length === 0) return true;
  return contributors.some((contributor) => contributor === memberId);
}
