// Simple serializer helpers: convert DB rows into the shape the client expects.

// Convert family member rows to a small public shape
export function serializeMembers(members: any[]) {
  return members.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email || '',
    role: m.role,
    initials: m.initials,
    age: m.age || undefined,
    allowanceUsd: m.allowanceUsd || undefined,
    allowanceDay: m.allowanceDay || undefined,
    allowanceOn: m.allowanceOn,
    permissions: m.permissions as Record<string, boolean>
  }))
}

// Convert wallet rows to client shape
export function serializeWallets(wallets: any[]) {
  return wallets.map(w => ({
    id: w.id,
    label: w.label,
    sub: w.sub,
    type: w.type,
    currency: w.currency,
    members: w.members as string[],
    color: w.color,
    startingBalanceUsd: w.startingBalanceUsd
  }))
}

// Convert budget categories to client shape
export function serializeCategories(categories: any[]) {
  return categories.map(c => ({
    id: c.id,
    label: c.label,
    limitUsd: c.limitUsd,
    color: c.color,
    icon: c.icon
  }))
}

// Convert transactions to simple fields the UI needs
export function serializeTransactions(transactions: any[]) {
  return transactions.map(t => ({
    id: t.id,
    name: t.name,
    who: t.who,
    usd: t.usd,
    category: t.category,
    wallet: t.wallet,
    date: t.date
  }))
}

// Convert goals to client shape (includes history and contributors)
export function serializeGoals(goals: any[]) {
  return goals.map(g => ({
    id: g.id,
    title: g.title,
    targetUsd: g.targetUsd,
    savedUsd: g.savedUsd,
    targetDate: g.targetDate,
    icon: g.icon,
    color: g.color,
    contributors: g.contributors as string[],
    history: g.history as any[]
  }))
}

// Convert linked bank info
export function serializeLinkedBanks(linkedBanks: any[]) {
  return linkedBanks.map(b => ({
    id: b.id,
    name: b.name,
    connectedAt: b.connectedAt,
    accounts: b.accounts as any[]
  }))
}

// Convert scheduled items (income/subscriptions)
export function serializeScheduleItems(scheduleItems: any[]) {
  return scheduleItems.map(item => ({
    id: item.id,
    label: item.label,
    every: item.every,
    amountUsd: item.amountUsd,
    color: item.color,
    type: item.type
  }))
}

// Convert loan entries for the client
export function serializeLoanEntries(loanEntries: any[]) {
  return loanEntries.map(entry => ({
    id: entry.id,
    ownerMemberId: entry.ownerMemberId ?? '',
    counterpartyMemberId: entry.counterpartyMemberId,
    counterpartyName: entry.counterpartyName,
    note: entry.note,
    due: entry.due,
    amountUsd: entry.amountUsd,
    paidAmountUsd: entry.paidAmountUsd,
    direction: entry.direction,
    status: entry.status,
    createdAt: entry.createdAt.toLocaleDateString()
  }))
}

// Convert tracked products data
export function serializeTrackedProducts(trackedProducts: any[]) {
  return trackedProducts.map(product => ({
    id: product.id,
    name: product.name,
    store: product.store,
    category: product.category,
    amountUsd: product.amountUsd,
    quantity: product.quantity,
    unitPriceUsd: product.unitPriceUsd,
    purchasedAt: product.purchasedAt,
    source: product.source,
    createdAt: product.createdAt.toLocaleDateString()
  }))
}

// Convert receipt scans
export function serializeReceiptScans(receiptScans: any[]) {
  return receiptScans.map(receipt => ({
    id: receipt.id,
    storeName: receipt.storeName,
    purchasedAt: receipt.purchasedAt,
    currency: receipt.currency,
    totalUsd: receipt.totalUsd,
    items: receipt.items,
    rawText: receipt.rawText || undefined,
    createdAt: receipt.createdAt.toLocaleDateString()
  }))
}

// Convert app notifications for the client
export function serializeNotifications(notifications: any[]) {
  return notifications.map(n => ({
    id: n.id,
    title: n.title,
    desc: n.desc,
    time: n.time,
    group: n.group,
    tone: n.tone,
    read: n.read,
    screen: n.screen
  }))
}
