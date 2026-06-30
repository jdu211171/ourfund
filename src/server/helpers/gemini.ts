export const TEMPORARY_RECEIPT_SCAN_ERROR =
  "AI receipt scanning is busy right now. We tried another model, but the service is still overloaded. Please try again shortly.";

export const DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export function splitGeminiModelList(value?: string) {
  return String(value || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

export function getReceiptScanModels() {
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const configuredFallbacks = splitGeminiModelList(process.env.GEMINI_FALLBACK_MODELS);
  const fallbackModels =
    configuredFallbacks.length > 0
      ? configuredFallbacks
      : DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS;

  return Array.from(new Set([primaryModel, ...fallbackModels].filter(Boolean)));
}

export function isRetryableGeminiFailure(status: number, body: string) {
  const normalized = body.toLowerCase();
  return (
    [429, 500, 502, 503, 504].includes(status) ||
    normalized.includes("high demand") ||
    normalized.includes("unavailable") ||
    normalized.includes("overloaded") ||
    normalized.includes("resource_exhausted")
  );
}

export function isGeminiModelUnavailable(status: number, body: string) {
  const normalized = body.toLowerCase();
  return (
    status === 404 ||
    normalized.includes("not found") ||
    normalized.includes("not supported") ||
    normalized.includes("model is not available")
  );
}

export function receiptScanFailureMessage(status: number) {
  if (status === 401 || status === 403) {
    return "Receipt scanning is not configured correctly yet.";
  }

  if (status === 413) {
    return "This receipt image is too large. Please upload a smaller photo.";
  }

  if (status === 400) {
    return "Receipt scanning could not process this image. Please try a clearer receipt photo.";
  }

  return "Receipt scanning failed. Please try again.";
}

export function parseGeminiJson(text: string) {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Gemini returned an unreadable receipt response");
  }
}
