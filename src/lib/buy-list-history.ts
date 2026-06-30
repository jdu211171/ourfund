// Shared purchase history powering Buy List suggestions and Price History.
// Supports generic Japanese grocery matching via character normalisation,
// a local synonym dictionary, and optional Gemini-derived canonical names.

export type PurchaseRecord = {
  name: string;
  price: number; // JPY
  shop: string;
  daysAgo: number;
};

export const PURCHASE_HISTORY: PurchaseRecord[] = [
  { name: "Milk 1L", price: 248, shop: "Lawson", daysAgo: 2 },
  { name: "Milk 1L", price: 198, shop: "FamilyMart", daysAgo: 9 },
  { name: "Milk 1L", price: 218, shop: "Seiyu", daysAgo: 14 },
  { name: "Milk 1L", price: 185, shop: "Gyomu Super", daysAgo: 21 },
  { name: "Eggs (10pcs)", price: 268, shop: "Seiyu", daysAgo: 3 },
  { name: "Eggs (10pcs)", price: 298, shop: "Lawson", daysAgo: 10 },
  { name: "Eggs (10pcs)", price: 248, shop: "Gyomu Super", daysAgo: 22 },
  { name: "Rice 5kg", price: 2480, shop: "Gyomu Super", daysAgo: 6 },
  { name: "Rice 5kg", price: 2780, shop: "Aeon", daysAgo: 18 },
  { name: "Olive oil 1L", price: 980, shop: "Aeon", daysAgo: 4 },
  { name: "Olive oil 1L", price: 1080, shop: "Seiyu", daysAgo: 16 },
  { name: "Bananas", price: 158, shop: "FamilyMart", daysAgo: 1 },
  { name: "Bananas", price: 128, shop: "Gyomu Super", daysAgo: 8 },
  { name: "Bananas", price: 168, shop: "Aeon", daysAgo: 17 },
  { name: "Bread loaf", price: 198, shop: "Lawson", daysAgo: 2 },
  { name: "Bread loaf", price: 178, shop: "Seiyu", daysAgo: 12 },
  { name: "Chicken breast 1kg", price: 698, shop: "Aeon", daysAgo: 5 },
  { name: "Chicken breast 1kg", price: 598, shop: "Gyomu Super", daysAgo: 13 },
  { name: "Tomatoes", price: 298, shop: "Seiyu", daysAgo: 3 },
  { name: "Tomatoes", price: 348, shop: "Aeon", daysAgo: 11 },
  { name: "Coffee beans 200g", price: 880, shop: "Kaldi", daysAgo: 7 },
  { name: "Coffee beans 200g", price: 980, shop: "Aeon", daysAgo: 20 },
  { name: "Yogurt 400g", price: 178, shop: "FamilyMart", daysAgo: 2 },
  { name: "Yogurt 400g", price: 158, shop: "Seiyu", daysAgo: 15 },
  { name: "Pasta 500g", price: 168, shop: "Gyomu Super", daysAgo: 9 },
  { name: "Pasta 500g", price: 198, shop: "Aeon", daysAgo: 19 },
  { name: "Tofu", price: 78, shop: "Seiyu", daysAgo: 4 },
  { name: "Tofu", price: 88, shop: "Lawson", daysAgo: 12 },
  { name: "Apples", price: 398, shop: "Aeon", daysAgo: 6 },
  { name: "Apples", price: 348, shop: "Gyomu Super", daysAgo: 14 },
];

export type Category = "Dairy" | "Produce" | "Meat" | "Bakery" | "Pantry" | "Other";

// conversion rate from USD to JPY
const JPY_RATE = 159.4;

// ---------------------------------------------------------------------------
// Phase 1 — Character normalisation
// ---------------------------------------------------------------------------

/**
 * Converts full-width (Zen-kaku) alphanumeric / punctuation characters to
 * their ASCII half-width (Han-kaku) equivalents, collapses full-width spaces,
 * and lowercases the result.  This means "牛乳　１Ｌ" and "牛乳 1L" both
 * become "牛乳 1l" before any comparison is performed.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .toLowerCase()
    .trim();
}

// ---------------------------------------------------------------------------
// Phase 1 — Synonym dictionary
// ---------------------------------------------------------------------------

type SynonymGroup = {
  /** Canonical English product name that maps to PURCHASE_HISTORY entries */
  canonical: string;
  category: Category;
  /**
   * All known aliases for the commodity in any writing system.
   * Already normalised (lowercase, half-width).  Use the same token
   * boundaries that appear on real Japanese receipts: both the root word
   * ("牛乳") and common qualifiers ("低脂肪乳", "成分無調整") are listed so
   * that either triggers a match.
   */
  tokens: string[];
};

/**
 * Deliberately generic: we do NOT try to distinguish brands or sizes here —
 * that stays in the display name (e.g. "明治おいしい牛乳 900ml").  The goal
 * is commodity-level matching so any entry about milk is surfaced when the
 * user searches for "低脂肪" or "ミルク".
 */
export const SYNONYM_GROUPS: SynonymGroup[] = [
  {
    canonical: "Milk 1L",
    category: "Dairy",
    tokens: [
      // Japanese
      "牛乳", "ぎゅうにゅう", "ミルク", "みるく",
      "低脂肪", "低脂肪乳", "無脂肪", "無脂肪乳",
      "成分無調整", "ホモジナイズ", "乳飲料", "加工乳",
      // English / romaji
      "milk", "牛乳1l", "牛乳1liter",
    ],
  },
  {
    canonical: "Eggs (10pcs)",
    category: "Meat",
    tokens: [
      "卵", "玉子", "たまご", "タマゴ",
      "鶏卵", "生卵", "ゆで卵", "ゆでたまご",
      "egg", "eggs",
    ],
  },
  {
    canonical: "Rice 5kg",
    category: "Pantry",
    tokens: [
      "米", "お米", "白米", "玄米", "もち米",
      "コシヒカリ", "あきたこまち", "ひとめぼれ",
      "ライス", "精米",
      "rice",
    ],
  },
  {
    canonical: "Bread loaf",
    category: "Bakery",
    tokens: [
      "パン", "食パン", "ブレッド", "ローフ",
      "トースト", "山型", "角型",
      "bread", "loaf",
    ],
  },
  {
    canonical: "Tomatoes",
    category: "Produce",
    tokens: [
      "トマト", "とまと", "ミニトマト",
      "tomato", "tomatoes",
    ],
  },
  {
    canonical: "Bananas",
    category: "Produce",
    tokens: [
      "バナナ", "ばなな",
      "banana", "bananas",
    ],
  },
  {
    canonical: "Apples",
    category: "Produce",
    tokens: [
      "りんご", "リンゴ", "林檎",
      "ふじ", "サンふじ", "つがる",
      "apple", "apples",
    ],
  },
  {
    canonical: "Chicken breast 1kg",
    category: "Meat",
    tokens: [
      "鶏肉", "とり肉", "鶏むね", "むね肉",
      "ブロイラー", "若鶏",
      "chicken", "breast",
    ],
  },
  {
    canonical: "Tofu",
    category: "Meat", // protein group
    tokens: [
      "豆腐", "とうふ", "絹豆腐", "木綿豆腐",
      "絹ごし", "木綿",
      "tofu",
    ],
  },
  {
    canonical: "Yogurt 400g",
    category: "Dairy",
    tokens: [
      "ヨーグルト", "よーぐると", "プレーンヨーグルト",
      "yogurt", "yoghurt",
    ],
  },
  {
    canonical: "Olive oil 1L",
    category: "Pantry",
    tokens: [
      "オリーブオイル", "オリーブ油", "エクストラバージン",
      "olive oil", "oliveoil",
    ],
  },
  {
    canonical: "Coffee beans 200g",
    category: "Pantry",
    tokens: [
      "コーヒー", "珈琲", "コーヒー豆", "アラビカ",
      "coffee", "beans",
    ],
  },
  {
    canonical: "Pasta 500g",
    category: "Pantry",
    tokens: [
      "パスタ", "スパゲッティ", "スパゲティ", "マカロニ",
      "pasta", "spaghetti",
    ],
  },
];

// Precompute: flat map from every token → canonical name for O(1) lookup
const TOKEN_TO_CANONICAL = new Map<string, string>();
const TOKEN_TO_CATEGORY = new Map<string, Category>();
for (const g of SYNONYM_GROUPS) {
  for (const t of g.tokens) {
    TOKEN_TO_CANONICAL.set(normalizeText(t), g.canonical);
    TOKEN_TO_CATEGORY.set(normalizeText(t), g.category);
  }
  // Also map the canonical itself
  TOKEN_TO_CANONICAL.set(normalizeText(g.canonical), g.canonical);
  TOKEN_TO_CATEGORY.set(normalizeText(g.canonical), g.category);
}

/**
 * Resolves a raw product name (Japanese or English, any character width) to
 * its canonical commodity name by:
 *  1. Normalising the text
 *  2. Checking exact token map
 *  3. Checking if the normalised text *contains* any known token
 */
export function resolveCanonical(name: string): string {
  const norm = normalizeText(name);
  // 1. Exact key lookup
  const exact = TOKEN_TO_CANONICAL.get(norm);
  if (exact) return exact;
  // 2. Substring scan — longer tokens first to prefer specific matches
  const sortedTokens = Array.from(TOKEN_TO_CANONICAL.keys()).sort(
    (a, b) => b.length - a.length,
  );
  for (const token of sortedTokens) {
    if (norm.includes(token)) {
      return TOKEN_TO_CANONICAL.get(token)!;
    }
  }
  // 3. Fallback: return normalised original
  return norm;
}

// ---------------------------------------------------------------------------
// Phase 1 — Category (updated to use synonym groups first)
// ---------------------------------------------------------------------------

export function categorize(name: string): Category {
  const norm = normalizeText(name);

  // Check synonym map first (handles Japanese)
  const exact = TOKEN_TO_CATEGORY.get(norm);
  if (exact) return exact;
  for (const token of Array.from(TOKEN_TO_CATEGORY.keys()).sort(
    (a, b) => b.length - a.length,
  )) {
    if (norm.includes(token)) return TOKEN_TO_CATEGORY.get(token)!;
  }

  // English regex fallback
  if (/milk|yogurt|cheese|butter|cream/.test(norm)) return "Dairy";
  if (/banana|apple|tomato|onion|lettuce|veg|fruit|potato|carrot/.test(norm))
    return "Produce";
  if (/chicken|beef|pork|fish|meat|tofu|egg/.test(norm)) return "Meat";
  if (/bread|loaf|bun|bagel|pastry/.test(norm)) return "Bakery";
  if (/rice|pasta|oil|coffee|tea|sugar|salt|flour|sauce/.test(norm))
    return "Pantry";
  return "Other";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getDaysAgo(dateStr?: string | null): number {
  if (!dateStr) return 1;
  if (dateStr === "today") return 0;
  if (dateStr === "yesterday") return 1;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 1;
    return Math.max(0, Math.round((Date.now() - d.getTime()) / 86_400_000));
  } catch {
    return 1;
  }
}

/** Returns true when `recordName` is considered the same commodity as `query`. */
function matches(query: string, recordName: string): boolean {
  const qCanon = resolveCanonical(query);
  const rCanon = resolveCanonical(recordName);
  // If both resolve to a canonical name, compare canonicals
  if (qCanon === rCanon) return true;
  // Substring matches on canonical strings
  if (qCanon.includes(rCanon) || rCanon.includes(qCanon)) return true;
  // Substring matches on raw normalised strings (covers partial brand names)
  const qNorm = normalizeText(query);
  const rNorm = normalizeText(recordName);
  return qNorm.includes(rNorm) || rNorm.includes(qNorm);
}

function dbToRecord(p: any): PurchaseRecord {
  return {
    name: p.name,
    price: Math.round((p.unitPriceUsd ?? p.amountUsd ?? 0) * JPY_RATE),
    shop: p.store || "Store",
    daysAgo: getDaysAgo(p.createdAt || p.purchasedAt),
  };
}

// ---------------------------------------------------------------------------
// Public API — all functions now use synonym-aware matching
// ---------------------------------------------------------------------------

export function findCheapest(
  name: string,
  dbProducts: any[] = [],
): PurchaseRecord | null {
  if (!name.trim()) return null;
  const allHits = [
    ...dbProducts.filter((p) => matches(name, p.name)).map(dbToRecord),
    ...PURCHASE_HISTORY.filter((r) => matches(name, r.name)),
  ];
  if (!allHits.length) return null;
  return allHits.reduce((a, b) => (a.price <= b.price ? a : b));
}

export function recentPrice(
  name: string,
  dbProducts: any[] = [],
): PurchaseRecord | null {
  if (!name.trim()) return null;
  const allHits = [
    ...dbProducts.filter((p) => matches(name, p.name)).map(dbToRecord),
    ...PURCHASE_HISTORY.filter((r) => matches(name, r.name)),
  ];
  if (!allHits.length) return null;
  return allHits.reduce((a, b) => (a.daysAgo <= b.daysAgo ? a : b));
}

export function priceHistoryFor(
  name: string,
  dbProducts: any[] = [],
): PurchaseRecord[] {
  if (!name.trim()) return [];
  const allHits = [
    ...dbProducts.filter((p) => matches(name, p.name)).map(dbToRecord),
    ...PURCHASE_HISTORY.filter((r) => matches(name, r.name)),
  ];
  return allHits.sort((a, b) => a.daysAgo - b.daysAgo);
}

/**
 * Suggests canonical display names from purchase history for a given query.
 * Now understands Japanese: "ミルク" → suggests "Milk 1L" entries.
 */
export function suggestNames(query: string, limit = 5): string[] {
  if (!query.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of PURCHASE_HISTORY) {
    if (seen.has(r.name)) continue;
    if (matches(query, r.name)) {
      seen.add(r.name);
      out.push(r.name);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function allProducts(dbProducts: any[] = []): string[] {
  const seen = new Set<string>();
  for (const p of dbProducts) seen.add(p.name);
  for (const r of PURCHASE_HISTORY) seen.add(r.name);
  return Array.from(seen);
}

export const fmtYen = (n: number) =>
  `¥${Math.round(n).toLocaleString("en-US")}`;
