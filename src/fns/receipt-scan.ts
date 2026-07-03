import { createServerFn } from '@tanstack/react-start'
import { getSessionUser } from '@/lib/auth-server'
import { currencyValueToUsd } from '@/lib/currency'
import { prisma } from '@/lib/db'
import {
  getReceiptScanModels,
  isGeminiModelUnavailable,
  isRetryableGeminiFailure,
  makeServerId,
  normalizeCurrencyCode,
  normalizeProductName,
  parseGeminiJson,
  receiptScanFailureMessage,
  TEMPORARY_RECEIPT_SCAN_ERROR
} from '@/server/helpers'

export const scanReceiptServerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { imageDataUrl: string; currency: string; categories?: string[]; localDate?: string }) => d
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('Receipt scanning is not configured yet.')
    }

    const match = data.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) {
      throw new Error('Upload a valid receipt image')
    }

    const user = await getSessionUser()
    const member = user?.householdMembers[0]
    const householdId = member?.householdId || null
    const currency = data.currency || 'JPY'
    const categoriesList =
      data.categories && data.categories.length > 0
        ? data.categories.join(', ')
        : 'Groceries, Dining, Household, Electronics, Clothing, Health, Other'
    const prompt = [
      'Extract line-item product data from this receipt.',
      'Japanese receipts are the primary target, so read Japanese product names carefully.',
      "Each item's price (unitPrice and totalPrice) MUST include tax. If the receipt lists prices excluding tax (such as on Japanese receipts marked with '外8' or '外10'), calculate the tax-inclusive price for each item (i.e. multiply by 1.08 or 1.10 respectively and round to the nearest integer) and return that calculated value. The sum of the item totalPrice values must equal the final total price including tax (合計) listed on the receipt.",
      'Ignore subtotal, tax, payment method, change, points, discounts without a product, and store metadata lines.',
      'Return strict JSON only with this shape:',
      `{"storeName":"string","purchasedAt":"YYYY-MM-DD format receipt date","currency":"JPY","items":[{"name":"string","category":"string","quantity":1,"unitPrice":100,"totalPrice":100}],"rawText":"short OCR text"}`,
      `Assign each item a category. Prioritize matching one of these existing categories if it fits: ${categoriesList}. If none fit well, suggest a new, appropriate category name (e.g. 'Snacks', 'Beverages', etc.).`,
      `Use ${currency} when the receipt currency is unclear.`
    ].join(' ')

    let parsed: any
    let sawTemporaryFailure = false
    let sawModelUnavailable = false
    let sawModelResponseFailure = false

    for (const candidateModel of getReceiptScanModels()) {
      let response: Response

      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: match[1],
                        data: match[2]
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: 'application/json'
              }
            })
          }
        )
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('fetch')) {
          sawTemporaryFailure = true
          continue
        }
        throw err
      }

      if (!response.ok) {
        const text = await response.text()
        if (isGeminiModelUnavailable(response.status, text)) {
          sawModelUnavailable = true
          continue
        }
        if (isRetryableGeminiFailure(response.status, text)) {
          sawTemporaryFailure = true
          continue
        }
        throw new Error(receiptScanFailureMessage(response.status))
      }

      const resBody = await response.json()
      try {
        parsed = parseGeminiJson(resBody)
        break
      } catch {
        sawModelResponseFailure = true
        continue
      }
    }

    if (!parsed) {
      if (sawModelUnavailable) {
        throw new Error(
          'Receipt scan service is temporarily busy. Please try again in a few seconds.'
        )
      }
      if (sawTemporaryFailure || sawModelResponseFailure) {
        throw new Error(TEMPORARY_RECEIPT_SCAN_ERROR)
      }
      throw new Error('Could not read receipt content. Please make sure the image is clear.')
    }

    const receiptCurrency = normalizeCurrencyCode(parsed.currency || currency)
    const dbProducts = await prisma.trackedProduct.findMany({
      where: { householdId: householdId || '' },
      orderBy: { createdAt: 'desc' }
    })

    const items = Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.products)
        ? parsed.products
        : []

    const normalizedItems = items
      .map((item: any) => {
        const quantity = Math.max(1, Number(item.quantity ?? 1))
        const totalPrice = Number(item.totalPrice ?? item.price ?? 0)
        const unitPrice = item.unitPrice ? Number(item.unitPrice) : totalPrice / quantity

        const unitPriceUsd = currencyValueToUsd(unitPrice, receiptCurrency as any)
        const totalUsd = currencyValueToUsd(totalPrice, receiptCurrency as any)

        const normalizedName = normalizeProductName(item.name || '')
        const previous = dbProducts.find(p => {
          const previousName = normalizeProductName(p.name)
          return (
            previousName === normalizedName ||
            (normalizedName.length > 2 &&
              (previousName.includes(normalizedName) || normalizedName.includes(previousName)))
          )
        })
        const previousPriceUsd =
          previous?.unitPriceUsd ??
          (previous ? previous.amountUsd / Math.max(previous.quantity, 1) : 0)
        const deltaPct =
          previousPriceUsd > 0 ? ((unitPriceUsd - previousPriceUsd) / previousPriceUsd) * 100 : 0

        return {
          name: String(item.name || 'Unknown item'),
          category: String(item.category || 'Groceries'),
          quantity,
          unitPriceUsd,
          totalUsd,
          originalPrice: totalPrice,
          comparison: previous
            ? {
                previousStore: previous.store,
                previousPriceUsd,
                deltaPct,
                trend: Math.abs(deltaPct) < 1 ? 'same' : deltaPct > 0 ? 'up' : 'down'
              }
            : null
        }
      })
      .filter((item: any) => item.totalUsd > 0)

    const totalUsd =
      normalizedItems.reduce((sum: number, item: any) => sum + item.totalUsd, 0) ||
      currencyValueToUsd(Number(parsed.totalPrice ?? parsed.total ?? 0), receiptCurrency as any)

    return {
      id: makeServerId('receipt'),
      storeName: String(parsed.storeName || parsed.store || 'Unknown store'),
      purchasedAt: normalizeReceiptDate(parsed.purchasedAt || parsed.date, data.localDate),
      currency: receiptCurrency,
      totalUsd,
      items: normalizedItems,
      rawText: typeof parsed.rawText === 'string' ? parsed.rawText.slice(0, 4000) : undefined,
      createdAt: 'today'
    }
  })

/** Returns today's date as YYYY-MM-DD using the provided UTC offset string (e.g. from the client). */
function serverFallbackDate(): string {
  // The server falls back to UTC; real local date comes from the client via localDate.
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Normalizes a receipt date string to YYYY-MM-DD.
 * @param dateStr - Raw date from the Gemini response (should be YYYY-MM-DD per prompt, but may not be).
 * @param localDate - The client's local date today as YYYY-MM-DD (user-timezone-aware). Used as fallback.
 */
function normalizeReceiptDate(dateStr: string | undefined | null, localDate?: string): string {
  // Build fallback: prefer the client-supplied local date, otherwise fall back to server UTC.
  const defaultDate =
    localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? localDate : serverFallbackDate()

  if (!dateStr) return defaultDate

  const clean = dateStr.trim().toLowerCase()
  if (clean === 'today' || clean === 'just now') {
    return defaultDate
  }
  if (clean === 'yesterday') {
    if (localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      const d = new Date(localDate + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      return d.toISOString().slice(0, 10)
    }
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    return yesterday.toISOString().slice(0, 10)
  }

  // Strip Japanese characters and non-standard separators
  const parseable = clean
    .replace(/\([月火水木金土日]\)/g, '')
    .replace(/年|月/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-')
    .trim()

  // Already a clean YYYY-MM-DD
  const isoMatch = parseable.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  // Try standard JS Date parsing as last resort
  const parsed = new Date(parseable)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return defaultDate
}
