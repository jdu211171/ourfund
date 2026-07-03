export function categoryAliases(label: string) {
  const lower = label.toLowerCase()
  if (lower.includes('rent') || lower.includes('util')) return ['rent', 'housing', 'electric']
  if (lower.includes('dining')) return ['dining', 'coffee', 'restaurant']
  if (lower.includes('transport')) return ['transport', 'gas', 'car']
  if (lower.includes('health') || lower.includes('medical'))
    return ['health', 'medical', 'pharmacy', 'doctor', 'dental']
  if (lower.includes('entertainment') || lower.includes('fun'))
    return ['entertainment', 'movie', 'games', 'fun', 'concert']
  if (lower.includes('education') || lower.includes('school'))
    return ['education', 'school', 'tuition', 'books', 'course']
  return [lower]
}

export function iconForCategoryLabel(label: string) {
  const lower = label.toLowerCase()
  if (lower.includes('rent') || lower.includes('housing') || lower.includes('home')) return 'home'
  if (lower.includes('utility') || lower.includes('bill') || lower.includes('electric')) {
    return 'utilities'
  }
  if (lower.includes('grocery') || lower.includes('market') || lower.includes('shopping')) {
    return 'shopping'
  }
  if (lower.includes('dining') || lower.includes('coffee') || lower.includes('cafe')) {
    return 'coffee'
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('meal')) {
    return 'food'
  }
  if (lower.includes('transport') || lower.includes('bus') || lower.includes('train')) {
    return 'transport'
  }
  if (lower.includes('fuel') || lower.includes('gas')) return 'fuel'
  if (lower.includes('car') || lower.includes('auto')) return 'car'
  if (lower.includes('health') || lower.includes('medical') || lower.includes('doctor')) {
    return 'health'
  }
  if (lower.includes('gift')) return 'gift'
  if (lower.includes('travel') || lower.includes('flight') || lower.includes('hotel')) {
    return 'travel'
  }
  if (lower.includes('school') || lower.includes('education') || lower.includes('tuition')) {
    return 'education'
  }
  if (lower.includes('book')) return 'books'
  if (lower.includes('music')) return 'music'
  if (lower.includes('movie') || lower.includes('entertainment') || lower.includes('game')) {
    return 'entertainment'
  }
  if (lower.includes('fitness') || lower.includes('gym')) return 'fitness'
  if (lower.includes('clothing') || lower.includes('clothes') || lower.includes('apparel')) {
    return 'clothing'
  }
  if (lower.includes('work') || lower.includes('office')) return 'work'
  if (lower.includes('bank') || lower.includes('finance')) return 'bank'
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('internet')) {
    return 'phone'
  }
  return 'shopping'
}
