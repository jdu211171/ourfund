import { createServerFn } from '@tanstack/react-start';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { currencyValueToUsd } from '@/lib/currency';
import { getReceiptScanModels, isRetryableGeminiFailure, isGeminiModelUnavailable, parseGeminiJson, receiptScanFailureMessage, TEMPORARY_RECEIPT_SCAN_ERROR, normalizeCurrencyCode, normalizeProductName, makeServerId } from '@/server/helpers';

export const scanReceiptServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; currency: string; categories?: string[] }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Receipt scanning is not configured yet.");
    }

    const match = data.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Upload a valid receipt image");
    }

    const user = await getSessionUser();
    const member = user?.householdMembers[0];
    const householdId = member?.householdId || null;
    const currency = data.currency || "JPY";
    const categoriesList =
      data.categories && data.categories.length > 0
        ? data.categories.join(", ")
        : "Groceries, Dining, Household, Electronics, Clothing, Health, Other";
    const prompt = [
      "Extract line-item product data from this receipt.",
      "Japanese receipts are the primary target, so read Japanese product names carefully.",
      "Each item's price (unitPrice and totalPrice) MUST include tax. If the receipt lists prices excluding tax (such as on Japanese receipts marked with '外8' or '外10'), calculate the tax-inclusive price for each item (i.e. multiply by 1.08 or 1.10 respectively and round to the nearest integer) and return that calculated value. The sum of the item totalPrice values must equal the final total price including tax (合計) listed on the receipt.",
      "Ignore subtotal, tax, payment method, change, points, discounts without a product, and store metadata lines.",
      "Return strict JSON only with this shape:",
      `{"storeName":"string","purchasedAt":"date or receipt date text","currency":"JPY","items":[{"name":"string","category":"string","quantity":1,"unitPrice":100,"totalPrice":100}],"rawText":"short OCR text"}`,
      `Assign each item a category. Prioritize matching one of these existing categories if it fits: ${categoriesList}. If none fit well, suggest a new, appropriate category name (e.g. 'Snacks', 'Beverages', etc.).`,
      `Use ${currency} when the receipt currency is unclear.`,
    ].join(" ");

    let parsed: any;
    let sawTemporaryFailure = false;
    let sawModelUnavailable = false;
    let sawModelResponseFailure = false;

    for (const candidateModel of getReceiptScanModels()) {
      let response: Response;

      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: match[1], data: match[2] } },
                  ],
                },
              ],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );
      } catch {
        sawTemporaryFailure = true;
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        if (isRetryableGeminiFailure(response.status, body)) {
          sawTemporaryFailure = true;
          continue;
        }

        if (isGeminiModelUnavailable(response.status, body)) {
          sawModelUnavailable = true;
          continue;
        }

        throw new Error(receiptScanFailureMessage(response.status));
      }

      const payload = await response.json().catch(() => null);
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== "string") {
        sawModelResponseFailure = true;
        continue;
      }

      try {
        parsed = parseGeminiJson(text);
        break;
      } catch {
        sawModelResponseFailure = true;
      }
    }

    if (!parsed) {
      if (sawTemporaryFailure) {
        throw new Error(TEMPORARY_RECEIPT_SCAN_ERROR);
      }

      if (sawModelResponseFailure) {
        throw new Error(
          "AI receipt scanning could not read this receipt clearly. Please try a sharper photo or enter it manually.",
        );
      }

      if (sawModelUnavailable) {
        throw new Error("Receipt scanning is not configured correctly yet.");
      }

      throw new Error("Receipt scanning failed. Please try again.");
    }

    const receiptCurrency = normalizeCurrencyCode(parsed.currency, currency);
    const trackedProducts = householdId
      ? await prisma.trackedProduct.findMany({
          where: { householdId },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map((item: any) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const totalPrice = Number(item.totalPrice ?? item.price ?? item.amount ?? 0);
        const unitPrice = Number((item.unitPrice ?? totalPrice / quantity) || 0);
        const totalUsd = currencyValueToUsd(totalPrice, receiptCurrency as any);
        const unitPriceUsd = currencyValueToUsd(unitPrice, receiptCurrency as any);
        const normalizedName = normalizeProductName(String(item.name || ""));
        const previous = trackedProducts.find((product) => {
          const previousName = normalizeProductName(product.name);
          return (
            normalizedName &&
            (previousName === normalizedName ||
              previousName.includes(normalizedName) ||
              normalizedName.includes(previousName))
          );
        });
        const previousPriceUsd =
          previous?.unitPriceUsd ??
          (previous ? previous.amountUsd / Math.max(previous.quantity, 1) : 0);
        const deltaPct =
          previousPriceUsd > 0 ? ((unitPriceUsd - previousPriceUsd) / previousPriceUsd) * 100 : 0;

        return {
          name: String(item.name || "Unknown item"),
          category: String(item.category || "Groceries"),
          quantity,
          unitPriceUsd,
          totalUsd,
          originalPrice: totalPrice,
          comparison: previous
            ? {
                previousStore: previous.store,
                previousPriceUsd,
                deltaPct,
                trend: Math.abs(deltaPct) < 1 ? "same" : deltaPct > 0 ? "up" : "down",
              }
            : null,
        };
      })
      .filter((item: any) => item.totalUsd > 0);

    const totalUsd =
      items.reduce((sum: number, item: any) => sum + item.totalUsd, 0) ||
      currencyValueToUsd(Number(parsed.totalPrice ?? parsed.total ?? 0), receiptCurrency as any);

    return {
      id: makeServerId("receipt"),
      storeName: String(parsed.storeName || parsed.store || "Unknown store"),
      purchasedAt: String(parsed.purchasedAt || parsed.date || "today"),
      currency: receiptCurrency,
      totalUsd,
      items,
      rawText: typeof parsed.rawText === "string" ? parsed.rawText.slice(0, 4000) : undefined,
      createdAt: "today",
    };
  });
