export function walletMembers(wallet: { members: any }) {
  return Array.isArray(wallet.members) ? (wallet.members as string[]) : []
}

export function canUseWalletAsTransferSource(
  wallet: { type: string; members: any },
  memberId: string,
  role: string
) {
  const members = walletMembers(wallet)
  const ownWallet = members.includes(memberId)
  if (role === 'Admin') return wallet.type !== 'private' || ownWallet
  return ownWallet && wallet.type !== 'shared'
}

export function canUseWalletAsTransferTarget(wallet: { type: string }, role: string) {
  if (role === 'Admin') return true
  return wallet.type === 'shared' || wallet.type === 'private'
}
