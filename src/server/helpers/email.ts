export function isDeliverableEmail(email?: string | null) {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return (
    normalized.includes('@') &&
    !normalized.endsWith('@pending.invite') &&
    !normalized.endsWith('@family.local')
  )
}

export function uniqueEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(emails.map(email => email?.trim()).filter((email): email is string => Boolean(email)))
  )
}
