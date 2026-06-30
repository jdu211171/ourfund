import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { normalizeText, resolveCanonical, SYNONYM_GROUPS } from "@/lib/buy-list-history";
import {
  getReceiptScanModels,
  isRetryableGeminiFailure,
  isGeminiModelUnavailable,
} from "@/server/helpers";

// ---------------------------------------------------------------------------
// Phase 3 — Synonym-expanded product search
// ---------------------------------------------------------------------------
// When the user types "低脂肪", we resolve it to the "Milk 1L" synonym group
// and query Postgres for ALL known aliases (牛乳, ミルク, milk, …) so results
// are surfaced regardless of how the product was originally saved.

function buildSearchTerms(query: string): string[] {
  const norm = normalizeText(query);
  // Find the synonym group that the query belongs to
  for (const g of SYNONYM_GROUPS) {
    if (g.tokens.some((t) => norm.includes(normalizeText(t)) || normalizeText(t).includes(norm))) {
      // Return canonical + all tokens as search terms
      return [g.canonical, ...g.tokens];
    }
  }
  // No synonym group found — use canonical resolution as a fallback
  const canon = resolveCanonical(query);
  return canon !== norm ? [query, canon] : [query];
}

export const searchProductsServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { query: string }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const member = user.householdMembers[0];
    const householdId = member?.householdId;
    if (!householdId) return [];

    const query = data.query.trim();
    if (!query) return [];

    // Phase 3: expand to all synonym terms before hitting the DB
    const searchTerms = buildSearchTerms(query);

    // Build OR conditions for each term
    const products = await prisma.trackedProduct.findMany({
      where: {
        householdId,
        OR: searchTerms.map((term) => ({
          name: { contains: term, mode: "insensitive" as const },
        })),
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return products;
  });

// ---------------------------------------------------------------------------
// Phase 2 — Gemini canonical extraction
// ---------------------------------------------------------------------------
// Called optionally from the client-side BuyListScreen when the user types a
// query that the local synonym table cannot resolve.  Gemini returns the
// canonical English commodity name which is then used for local history
// lookups.  The result is cached on the client so we only pay one API call
// per unique unknown term.

export const resolveCanonicalServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }) => {
    const rawName = data.name.trim();
    if (!rawName) return null;

    // Try local resolution first — only call Gemini if we can't resolve locally
    const localCanon = resolveCanonical(rawName);
    const normRaw = normalizeText(rawName);
    if (localCanon !== normRaw) {
      // Local dictionary resolved it — no need for Gemini
      return { canonical: localCanon, source: "local" as const };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return null;

    const prompt = [
      "You are a grocery product name normalizer specialized in Japanese products.",
      "Given the raw product name from a Japanese receipt or grocery store, identify the canonical English commodity name.",
      "For example: '明治おいしい低脂肪乳 900ml' → 'Milk 1L', '有機卵Ｌサイズ10個' → 'Eggs (10pcs)', 'コシヒカリ 5kg' → 'Rice 5kg'",
      "Keep the canonical name short and generic (the commodity, not the brand).",
      "Return ONLY valid JSON: {\"canonical\": \"canonical English name\", \"category\": \"Dairy|Produce|Meat|Bakery|Pantry|Other\"}",
      `Product name: "${rawName}"`,
    ].join(" ");

    for (const model of getReceiptScanModels()) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        if (!response.ok) {
          const body = await response.text();
          if (isRetryableGeminiFailure(response.status, body)) continue;
          if (isGeminiModelUnavailable(response.status, body)) continue;
          break;
        }

        const payload = await response.json().catch(() => null);
        const text: string | undefined =
          payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        try {
          const cleaned = text
            .replace(/^```(?:json)?/i, "")
            .replace(/```$/i, "")
            .trim();
          const parsed = JSON.parse(cleaned);
          if (parsed?.canonical && typeof parsed.canonical === "string") {
            return { canonical: parsed.canonical as string, source: "gemini" as const };
          }
        } catch {
          continue;
        }
      } catch {
        continue;
      }
    }

    return null;
  });
