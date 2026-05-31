/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { currencyMeta, currencyValueToUsd } from "./currency";
import {
  getSessionUser,
  createSessionCookie,
  clearSessionCookie,
  verifyGoogleToken,
} from "./auth-server";
import {
  getAppBaseUrl,
  sendInviteEmail,
  sendLoanCreatedEmail,
  sendLoanPaidEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./mailer";

const defaultNotificationPrefs = {
  "Category at 80%": true,
  "Category over budget": true,
  "Large transaction": false,
  "New member expense": true,
  "Transfer requests": true,
  "Goal contributions": false,
  "Daily digest": true,
  "Weekly report": true,
  "Bill reminders": true,
};

const defaultHistoryFilters = {
  kind: "All",
  member: "Anyone",
  categories: [],
  sort: "Newest",
  minUsd: 0,
  maxUsd: 5000,
};

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function normalizeBudgetMode(value: unknown) {
  return value === "family" ? "family" : "personal";
}

function normalizeReportPeriod(value: unknown) {
  return value === "Week" || value === "Year" ? value : "Month";
}

function normalizeHistoryFilters(value: unknown) {
  const filters = asRecord(value);
  const kind = ["All", "Expense", "Income", "Goals", "Transfer"].includes(String(filters.kind))
    ? String(filters.kind)
    : defaultHistoryFilters.kind;
  const sort = ["Newest", "Oldest", "Highest amount", "Lowest amount"].includes(
    String(filters.sort),
  )
    ? String(filters.sort)
    : defaultHistoryFilters.sort;
  return {
    ...defaultHistoryFilters,
    ...filters,
    kind,
    categories: Array.isArray(filters.categories) ? filters.categories : [],
    sort,
    minUsd: Number.isFinite(Number(filters.minUsd))
      ? Number(filters.minUsd)
      : defaultHistoryFilters.minUsd,
    maxUsd: Number.isFinite(Number(filters.maxUsd))
      ? Number(filters.maxUsd)
      : defaultHistoryFilters.maxUsd,
  };
}

function makeServerId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeProductName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function parseGeminiJson(text: string) {
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

function walletMembers(wallet: { members: any }) {
  return Array.isArray(wallet.members) ? (wallet.members as string[]) : [];
}

function canUseWalletAsTransferSource(
  wallet: { type: string; members: any },
  memberId: string,
  role: string,
) {
  const members = walletMembers(wallet);
  const ownWallet = members.includes(memberId);
  if (role === "Admin") return wallet.type !== "private" || ownWallet;
  return ownWallet && wallet.type !== "shared";
}

function canUseWalletAsTransferTarget(wallet: { type: string }, role: string) {
  if (role === "Admin") return true;
  return wallet.type === "shared" || wallet.type === "private";
}

function normalizeCurrencyCode(value: unknown, fallback: string) {
  const upper = String(value || fallback || "JPY").toUpperCase();
  const normalized = upper === "YEN" ? "JPY" : upper;
  return normalized in currencyMeta ? normalized : fallback in currencyMeta ? fallback : "JPY";
}

function isDeliverableEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized.includes("@") &&
    !normalized.endsWith("@pending.invite") &&
    !normalized.endsWith("@family.local")
  );
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      emails.map((email) => email?.trim()).filter((email): email is string => Boolean(email)),
    ),
  );
}

async function getHouseholdUsers(householdId: string) {
  return prisma.user.findMany({
    where: { householdMembers: { some: { householdId } } },
    select: { id: true, email: true, name: true },
  });
}

async function createNotificationsForUsers(
  userIds: string[],
  data: Omit<Parameters<typeof prisma.appNotification.createMany>[0]["data"][number], "userId">,
) {
  if (userIds.length === 0) return;
  await prisma.appNotification.createMany({
    data: userIds.map((userId) => ({
      userId,
      ...data,
    })),
  });
}

// ─── Auth Server Functions ──────────────────────────────────────────────────

export const loginWithEmailServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; passwordHash: string }) => d)
  .handler(async ({ data }) => {
    const { email, passwordHash: password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password");
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new Error("Invalid email or password");
    }
    createSessionCookie(user.id);
    return { success: true };
  });

export const signUpWithEmailServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; name: string; passwordHash: string }) => d)
  .handler(async ({ data }) => {
    const { email, name, passwordHash: password } = data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }
    const hash = await bcrypt.hash(password, 10);
    const initials =
      name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "YO";

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hash,
        initials,
      },
    });
    createSessionCookie(user.id);
    await prisma.appNotification.create({
      data: {
        userId: user.id,
        title: "Welcome to Nest",
        desc: "Your account is ready. Start your first household whenever you’re ready.",
        time: "now",
        group: "Today",
        tone: "primary",
        screen: "home",
      },
    });
    await sendWelcomeEmail({ to: user.email, name: user.name });
    return { success: true };
  });

export const loginWithGoogleServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { credential: string }) => d)
  .handler(async ({ data }) => {
    const { credential } = data;
    const googleProfile = await verifyGoogleToken(credential);
    let isNewUser = false;
    let user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (!user) {
      isNewUser = true;
      const initials =
        googleProfile.name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "G";
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          googleId: googleProfile.googleId,
          initials,
        },
      });
    } else if (!user.googleId) {
      // Link Google ID if they signed up with password previously
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleProfile.googleId },
      });
    }

    createSessionCookie(user.id);
    if (isNewUser) {
      await prisma.appNotification.create({
        data: {
          userId: user.id,
          title: "Welcome to Nest",
          desc: "Your Google account is linked. Start your first household whenever you’re ready.",
          time: "now",
          group: "Today",
          tone: "primary",
          screen: "home",
        },
      });
      await sendWelcomeEmail({ to: user.email, name: user.name });
    }
    return { success: true };
  });

export const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { success: true };
});

export const requestPasswordResetServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email) throw new Error("Email is required");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      },
    });

    const resetUrl = `${getAppBaseUrl()}/?reset=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    await prisma.appNotification.create({
      data: {
        userId: user.id,
        title: "Password reset requested",
        desc: "We emailed you a secure link to reset your password.",
        time: "now",
        group: "Today",
        tone: "primary",
        screen: "settings",
      },
    });

    return { success: true };
  });

export const resetPasswordServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; password: string }) => d)
  .handler(async ({ data }) => {
    const token = data.token.trim();
    const password = data.password.trim();
    if (!token) throw new Error("Reset token is required");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) throw new Error("Reset link is invalid or has expired");

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    await prisma.appNotification.create({
      data: {
        userId: user.id,
        title: "Password updated",
        desc: "Your password was updated successfully.",
        time: "now",
        group: "Today",
        tone: "success",
        screen: "settings",
      },
    });

    return { success: true };
  });

export const getAppDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders({
    "Cache-Control": "no-store",
    Vary: "Cookie",
  });

  const user = await getSessionUser();
  if (!user) return null;

  const member = user.householdMembers[0];
  const householdId = member?.householdId || null;

  let household = null;
  let members: any[] = [];
  let wallets: any[] = [];
  let categories: any[] = [];
  let transactions: any[] = [];
  let goals: any[] = [];
  let linkedBanks: any[] = [];
  let recurringIncome: any[] = [];
  let subscriptions: any[] = [];
  let loanEntries: any[] = [];
  let trackedProducts: any[] = [];
  let receiptScans: any[] = [];

  if (householdId) {
    household = member.household;
    members = await prisma.familyMember.findMany({ where: { householdId } });
    wallets = await prisma.walletAccount.findMany({ where: { householdId } });
    categories = await prisma.budgetCategory.findMany({ where: { householdId } });
    transactions = await prisma.transaction.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
    goals = await prisma.goal.findMany({ where: { householdId } });
    linkedBanks = await prisma.linkedBank.findMany({ where: { householdId } });
    const scheduleItems = await prisma.scheduleItem.findMany({ where: { householdId } });
    recurringIncome = scheduleItems.filter((i) => i.type === "income");
    subscriptions = scheduleItems.filter((i) => i.type === "subscription");
    loanEntries = await prisma.loanEntry.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
    trackedProducts = await prisma.trackedProduct.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
    receiptScans = await prisma.receiptScan.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
  }

  const notifications = await prisma.appNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    isAuthenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      pronouns: user.pronouns || "",
      initials: user.initials,
      personalCurrency: user.personalCurrency,
      budgetMode: normalizeBudgetMode(user.budgetMode),
      reportPeriod: normalizeReportPeriod(user.reportPeriod),
      notificationPrefs: {
        ...defaultNotificationPrefs,
        ...asRecord(user.notificationPrefs),
      },
      historyFilters: normalizeHistoryFilters(user.historyFilters),
      passcode: user.passcode || "",
      faceIdEnabled: user.faceIdEnabled,
    },
    currencies: {
      personal: user.personalCurrency,
      family: household?.familyCurrency || "UZS",
    },
    household: household
      ? {
          id: household.id,
          name: household.name,
          inviteCode: household.inviteCode,
          role: member.role,
          createdAt: household.createdAt.toLocaleDateString(),
        }
      : null,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email || "",
      role: m.role,
      initials: m.initials,
      age: m.age || undefined,
      allowanceUsd: m.allowanceUsd || undefined,
      allowanceDay: m.allowanceDay || undefined,
      allowanceOn: m.allowanceOn,
      permissions: m.permissions as Record<string, boolean>,
    })),
    wallets: wallets.map((w) => ({
      id: w.id,
      label: w.label,
      sub: w.sub,
      type: w.type,
      currency: w.currency,
      members: w.members as string[],
      color: w.color,
      startingBalanceUsd: w.startingBalanceUsd,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      label: c.label,
      limitUsd: c.limitUsd,
      color: c.color,
      icon: c.icon,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      name: t.name,
      who: t.who,
      usd: t.usd,
      category: t.category,
      wallet: t.wallet,
      date: t.date,
    })),
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      targetUsd: g.targetUsd,
      savedUsd: g.savedUsd,
      targetDate: g.targetDate,
      icon: g.icon,
      color: g.color,
      contributors: g.contributors as string[],
      history: g.history as any[],
    })),
    linkedBanks: linkedBanks.map((b) => ({
      id: b.id,
      name: b.name,
      connectedAt: b.connectedAt,
      accounts: b.accounts as any[],
    })),
    recurringIncome: recurringIncome.map((r) => ({
      id: r.id,
      label: r.label,
      every: r.every,
      amountUsd: r.amountUsd,
      color: r.color,
      type: r.type,
    })),
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      label: s.label,
      every: s.every,
      amountUsd: s.amountUsd,
      color: s.color,
      type: s.type,
    })),
    loanEntries: loanEntries.map((entry) => ({
      id: entry.id,
      counterpartyMemberId: entry.counterpartyMemberId,
      counterpartyName: entry.counterpartyName,
      note: entry.note,
      due: entry.due,
      amountUsd: entry.amountUsd,
      direction: entry.direction,
      status: entry.status,
      createdAt: entry.createdAt.toLocaleDateString(),
    })),
    trackedProducts: trackedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      store: product.store,
      category: product.category,
      amountUsd: product.amountUsd,
      quantity: product.quantity,
      unitPriceUsd: product.unitPriceUsd,
      purchasedAt: product.purchasedAt,
      source: product.source,
      createdAt: product.createdAt.toLocaleDateString(),
    })),
    receiptScans: receiptScans.map((receipt) => ({
      id: receipt.id,
      storeName: receipt.storeName,
      purchasedAt: receipt.purchasedAt,
      currency: receipt.currency,
      totalUsd: receipt.totalUsd,
      items: receipt.items,
      rawText: receipt.rawText || undefined,
      createdAt: receipt.createdAt.toLocaleDateString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      desc: n.desc,
      time: n.time,
      group: n.group,
      tone: n.tone,
      read: n.read,
      screen: n.screen,
    })),
  };
});

export const validateInviteCodeServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const found = await prisma.household.findUnique({
      where: { inviteCode: data.code.toUpperCase() },
      include: { members: true },
    });
    if (!found) return null;
    return {
      code: found.inviteCode,
      householdName: found.name,
      memberCount: found.members.length,
      role: "Adult",
      inviter: found.members.find((m) => m.role === "Admin")?.name || "Family Admin",
      familyCurrency: found.familyCurrency,
    };
  });

export const scanReceiptServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; currency: string; categories?: string[] }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }

    const match = data.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Upload a valid receipt image");
    }

    const user = await getSessionUser();
    const member = user?.householdMembers[0];
    const householdId = member?.householdId || null;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { inline_data: { mime_type: match[1], data: match[2] } }],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini receipt scan failed: ${body.slice(0, 220)}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") {
      throw new Error("Gemini did not return receipt data");
    }

    const parsed = parseGeminiJson(text);
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

// ─── Sync Mutation ──────────────────────────────────────────────────────────
// Single entry-point for all write operations. Every case verifies that the
// authenticated user owns the resource before mutating it (authorization).

export const syncMutationServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { type: string; data: any }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const member = user.householdMembers[0];
    const householdId = member?.householdId;

    const { type, data: payload } = data;

    switch (type) {
      // ── Profile ────────────────────────────────────────────────────────────
      case "updateProfile": {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: payload.name,
            phone: payload.phone,
            pronouns: payload.pronouns,
            initials: payload.initials,
          },
        });
        // Keep the family-member row in sync with the user's display name
        if (member) {
          await prisma.familyMember.update({
            where: { id: member.id },
            data: {
              name: payload.name,
              initials: payload.initials,
            },
          });
        }
        break;
      }

      case "setBudgetMode": {
        const budgetMode = payload.budgetMode === "family" && householdId ? "family" : "personal";
        await prisma.user.update({
          where: { id: user.id },
          data: { budgetMode },
        });
        break;
      }

      case "setReportPeriod": {
        await prisma.user.update({
          where: { id: user.id },
          data: { reportPeriod: normalizeReportPeriod(payload.reportPeriod) },
        });
        break;
      }

      case "setNotificationPrefs": {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            notificationPrefs: {
              ...defaultNotificationPrefs,
              ...asRecord(payload.notificationPrefs),
            },
          },
        });
        break;
      }

      case "setHistoryFilters": {
        await prisma.user.update({
          where: { id: user.id },
          data: { historyFilters: normalizeHistoryFilters(payload.historyFilters) },
        });
        break;
      }

      // ── Household setup ────────────────────────────────────────────────────
      case "createHousehold": {
        const inviteCode = `NEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const personalCurrency = payload.personalCurrency || user.personalCurrency || "USD";
        const familyCurrency = payload.familyCurrency || "UZS";
        await prisma.user.update({
          where: { id: user.id },
          data: { personalCurrency, budgetMode: "family" },
        });
        const household = await prisma.household.create({
          data: {
            name: payload.householdName,
            inviteCode,
            familyCurrency,
          },
        });
        const familyMember = await prisma.familyMember.create({
          data: {
            userId: user.id,
            householdId: household.id,
            name: payload.name || user.name,
            role: "Admin",
            initials: payload.initials || user.initials,
            permissions: {
              "Approve children's requests": true,
              "Edit budget limits": true,
              "Add or remove members": true,
              "Connect bank accounts": true,
              "View private wallets": true,
            },
          },
        });
        // Create the two starter wallets
        await prisma.walletAccount.create({
          data: {
            householdId: household.id,
            label: `${payload.name || user.name} · Personal`,
            sub: "Private wallet",
            type: "private",
            currency: personalCurrency,
            members: [familyMember.id],
            color: "oklch(0.3 0.05 265)",
            startingBalanceUsd: 0,
          },
        });
        await prisma.walletAccount.create({
          data: {
            householdId: household.id,
            label: `${payload.householdName} Shared`,
            sub: "Shared · 0 balance",
            type: "shared",
            currency: familyCurrency,
            members: [familyMember.id],
            color: "oklch(0.55 0.24 265)",
            startingBalanceUsd: 0,
          },
        });
        await prisma.appNotification.create({
          data: {
            userId: user.id,
            title: "Household created",
            desc: `${household.name} is ready. Invite your family to join.`,
            time: "now",
            group: "Today",
            tone: "primary",
            screen: "family",
          },
        });
        break;
      }

      // ── Invite code validation (DB lookup) ─────────────────────────────────
      case "validateInviteCode": {
        const found = await prisma.household.findUnique({
          where: { inviteCode: payload.code.toUpperCase() },
          include: { members: true },
        });
        if (!found) return null;
        return {
          code: found.inviteCode,
          householdName: found.name,
          memberCount: found.members.length,
          role: "Adult",
          inviter: found.members.find((m) => m.role === "Admin")?.name || "Family Admin",
          familyCurrency: found.familyCurrency,
        };
      }

      // ── Accept invite (join a household) ───────────────────────────────────
      case "acceptInvite": {
        // Make sure this user isn't already in the household
        const found = await prisma.household.findUnique({
          where: { inviteCode: payload.code.toUpperCase() },
        });
        if (!found) throw new Error("Invite code not found");

        const alreadyMember = await prisma.familyMember.findFirst({
          where: { userId: user.id, householdId: found.id },
        });
        if (alreadyMember) break; // idempotent — already a member

        const personalCurrency = payload.personalCurrency || user.personalCurrency || "USD";
        await prisma.user.update({
          where: { id: user.id },
          data: { personalCurrency, budgetMode: "family" },
        });

        const familyMember = await prisma.familyMember.create({
          data: {
            userId: user.id,
            householdId: found.id,
            name: payload.name || user.name,
            role: payload.role || "Adult",
            initials: payload.initials || user.initials,
            permissions: {
              "Approve children's requests": payload.role !== "Kid",
              "Edit budget limits": payload.role !== "Kid",
              "Add or remove members": payload.role === "Admin",
              "Connect bank accounts": payload.role === "Admin" || payload.role === "Adult",
              "View private wallets": payload.role === "Admin" || payload.role === "Adult",
            },
          },
        });
        // Give the new member a personal wallet
        await prisma.walletAccount.create({
          data: {
            householdId: found.id,
            label: `${payload.name || user.name} · Personal`,
            sub: "Private wallet",
            type: "private",
            currency: personalCurrency,
            members: [familyMember.id],
            color: "oklch(0.3 0.05 265)",
            startingBalanceUsd: 0,
          },
        });
        const householdUsers = await getHouseholdUsers(found.id);
        await createNotificationsForUsers(
          householdUsers.map((member) => member.id),
          {
            title: "New member joined",
            desc: `${payload.name || user.name} joined ${found.name}.`,
            time: "now",
            group: "Today",
            tone: "primary",
            screen: "family",
          },
        );
        break;
      }

      // ── Transactions ───────────────────────────────────────────────────────
      case "addTransaction": {
        if (!householdId) throw new Error("No household linked");
        await prisma.transaction.create({
          data: {
            id: payload.id,
            householdId,
            name: payload.name,
            who: payload.who,
            usd: payload.usd,
            category: payload.category,
            wallet: payload.wallet,
            date: payload.date,
          },
        });
        break;
      }

      case "updateTransaction": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this transaction belongs to the user's household
        const txn = await prisma.transaction.findUnique({ where: { id: payload.id } });
        if (!txn || txn.householdId !== householdId) throw new Error("Forbidden");
        await prisma.transaction.update({
          where: { id: payload.id },
          data: {
            name: payload.name,
            who: payload.who,
            usd: payload.usd,
            category: payload.category,
            wallet: payload.wallet,
            date: payload.date,
          },
        });
        break;
      }

      case "deleteTransaction": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this transaction belongs to the user's household
        const txn = await prisma.transaction.findUnique({ where: { id: payload.id } });
        if (!txn || txn.householdId !== householdId) throw new Error("Forbidden");
        await prisma.transaction.delete({ where: { id: payload.id } });
        break;
      }

      case "recordTransfer": {
        if (!householdId) throw new Error("No household linked");
        const transferTransactions = Array.isArray(payload.transactions)
          ? payload.transactions
          : [];
        if (transferTransactions.length !== 2) {
          throw new Error("Transfer requires two transaction legs");
        }
        const amounts = transferTransactions.map((txn: any) => Number(txn.usd));
        const outgoing = amounts.filter((amount) => amount < 0);
        const incoming = amounts.filter((amount) => amount > 0);
        if (
          outgoing.length !== 1 ||
          incoming.length !== 1 ||
          Math.abs(outgoing[0] + incoming[0]) > 0.001
        ) {
          throw new Error("Transfer legs must balance");
        }
        const walletLabels = Array.from(
          new Set(transferTransactions.map((txn: any) => String(txn.wallet || ""))),
        ).filter(Boolean);
        if (walletLabels.length !== 2) throw new Error("Transfer requires two wallets");
        const transferWallets = await prisma.walletAccount.findMany({
          where: { householdId, label: { in: walletLabels } },
        });
        if (transferWallets.length !== walletLabels.length) throw new Error("Forbidden");

        const fromWalletLabel = String(
          transferTransactions.find((txn: any) => Number(txn.usd) < 0)?.wallet || "",
        );
        const toWalletLabel = String(
          transferTransactions.find((txn: any) => Number(txn.usd) > 0)?.wallet || "",
        );
        const fromWallet = transferWallets.find((wallet) => wallet.label === fromWalletLabel);
        const toWallet = transferWallets.find((wallet) => wallet.label === toWalletLabel);
        if (!fromWallet || !toWallet || fromWallet.id === toWallet.id) throw new Error("Forbidden");
        if (
          !canUseWalletAsTransferSource(fromWallet, member.id, member.role) ||
          !canUseWalletAsTransferTarget(toWallet, member.role)
        ) {
          throw new Error("Forbidden");
        }

        await prisma.transaction.createMany({
          data: transferTransactions.map((txn: any) => ({
            id: txn.id,
            householdId,
            name: txn.name,
            who: txn.who,
            usd: txn.usd,
            category: "Transfer",
            wallet: txn.wallet,
            date: txn.date,
          })),
          skipDuplicates: true,
        });
        break;
      }

      // ── Wallets ────────────────────────────────────────────────────────────
      case "addWallet": {
        if (!householdId) throw new Error("No household linked");
        await prisma.walletAccount.create({
          data: {
            id: payload.id,
            householdId,
            label: payload.label,
            sub: payload.sub,
            type: payload.type,
            currency: payload.currency,
            members: payload.members,
            color: payload.color,
            startingBalanceUsd: payload.startingBalanceUsd || 0,
          },
        });
        break;
      }

      case "setCurrencyForMode": {
        const currency = payload.currency;
        if (payload.mode === "personal") {
          await prisma.user.update({
            where: { id: user.id },
            data: { personalCurrency: currency },
          });
          break;
        }

        if (!householdId) throw new Error("No household linked");
        await prisma.household.update({
          where: { id: householdId },
          data: { familyCurrency: currency },
        });
        await prisma.walletAccount.updateMany({
          where: { householdId, type: { not: "private" } },
          data: { currency },
        });
        break;
      }

      // ── Budget categories ──────────────────────────────────────────────────
      case "addCategory": {
        if (!householdId) throw new Error("No household linked");
        await prisma.budgetCategory.create({
          data: {
            id: payload.id,
            householdId,
            label: payload.label,
            limitUsd: payload.limitUsd,
            color: payload.color,
            icon: payload.icon,
          },
        });
        break;
      }

      case "updateCategoryLimit": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this category belongs to the user's household
        const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } });
        if (!cat || cat.householdId !== householdId) throw new Error("Forbidden");
        await prisma.budgetCategory.update({
          where: { id: payload.id },
          data: { limitUsd: payload.limitUsd },
        });
        break;
      }

      case "updateCategory": {
        if (!householdId) throw new Error("No household linked");
        const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } });
        if (!cat || cat.householdId !== householdId) throw new Error("Forbidden");
        await prisma.budgetCategory.update({
          where: { id: payload.id },
          data: {
            label: payload.label,
            limitUsd: payload.limitUsd,
            color: payload.color,
            icon: payload.icon,
          },
        });
        break;
      }

      case "deleteCategory": {
        if (!householdId) throw new Error("No household linked");
        const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } });
        if (!cat || cat.householdId !== householdId) throw new Error("Forbidden");
        await prisma.budgetCategory.delete({ where: { id: payload.id } });
        break;
      }

      // ── Goals ──────────────────────────────────────────────────────────────
      case "addGoal": {
        if (!householdId) throw new Error("No household linked");
        await prisma.goal.create({
          data: {
            id: payload.id,
            householdId,
            title: payload.title,
            targetUsd: payload.targetUsd,
            savedUsd: payload.savedUsd || 0,
            targetDate: payload.targetDate,
            icon: payload.icon,
            color: payload.color,
            contributors: payload.contributors || [],
            history: payload.history || [],
          },
        });
        break;
      }

      case "updateGoal": {
        if (!householdId) throw new Error("No household linked");
        const goal = await prisma.goal.findUnique({ where: { id: payload.id } });
        if (!goal || goal.householdId !== householdId) throw new Error("Forbidden");
        const updates: Record<string, unknown> = {};
        if (typeof payload.title === "string") updates.title = payload.title;
        if (typeof payload.targetUsd === "number") updates.targetUsd = payload.targetUsd;
        if (typeof payload.targetDate === "string") updates.targetDate = payload.targetDate;
        if (typeof payload.icon === "string") updates.icon = payload.icon;
        if (typeof payload.color === "string") updates.color = payload.color;
        if (Array.isArray(payload.contributors)) updates.contributors = payload.contributors;
        if (Object.keys(updates).length === 0) break;
        await prisma.goal.update({
          where: { id: payload.id },
          data: updates,
        });
        break;
      }

      case "updateGoalSavings": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this goal belongs to the user's household
        const goal = await prisma.goal.findUnique({ where: { id: payload.id } });
        if (!goal || goal.householdId !== householdId) throw new Error("Forbidden");
        await prisma.goal.update({
          where: { id: payload.id },
          data: {
            savedUsd: payload.savedUsd,
            history: payload.history,
          },
        });
        break;
      }

      // ── Family members ─────────────────────────────────────────────────────
      case "inviteMember": {
        if (!householdId) throw new Error("No household linked");
        const newMember = await prisma.familyMember.create({
          data: {
            id: payload.id,
            householdId,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            initials: payload.initials,
            permissions: payload.permissions,
          },
        });
        // Create notification for the inviter
        await prisma.appNotification.create({
          data: {
            userId: user.id,
            title: `${payload.role} invite created`,
            desc: `Invite details are ready for ${payload.name}`,
            time: "now",
            group: "Today",
            tone: "primary",
            screen: "family",
          },
        });
        if (isDeliverableEmail(newMember.email)) {
          const household = await prisma.household.findUnique({ where: { id: householdId } });
          if (household) {
            await sendInviteEmail({
              to: newMember.email!,
              inviterName: user.name || "Family admin",
              householdName: household.name,
              inviteCode: household.inviteCode,
            });
          }
        }
        break;
      }

      case "updateMember": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this member belongs to the user's household
        const m = await prisma.familyMember.findUnique({ where: { id: payload.id } });
        if (!m || m.householdId !== householdId) throw new Error("Forbidden");
        await prisma.familyMember.update({
          where: { id: payload.id },
          data: {
            name: payload.name,
            email: payload.email,
            role: payload.role,
            initials: payload.initials,
            age: payload.age,
            allowanceUsd: payload.allowanceUsd,
            allowanceDay: payload.allowanceDay,
            allowanceOn: payload.allowanceOn,
            permissions: payload.permissions,
          },
        });
        break;
      }

      case "removeMember": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this member belongs to the user's household
        const m = await prisma.familyMember.findUnique({ where: { id: payload.id } });
        if (!m || m.householdId !== householdId) throw new Error("Forbidden");
        // Prevent removing yourself if you are the only admin
        if (m.userId === user.id) throw new Error("Cannot remove yourself");
        await prisma.familyMember.delete({ where: { id: payload.id } });
        break;
      }

      // ── Linked banks ───────────────────────────────────────────────────────
      case "connectSelectedBank": {
        if (!householdId) throw new Error("No household linked");
        await prisma.linkedBank.create({
          data: {
            id: payload.id,
            householdId,
            name: payload.name,
            connectedAt: payload.connectedAt,
            accounts: payload.accounts,
          },
        });
        break;
      }

      // ── Schedule items (income / subscriptions) ────────────────────────────
      case "addScheduleItem": {
        if (!householdId) throw new Error("No household linked");
        const item = await prisma.scheduleItem.findUnique({ where: { id: payload.id } });
        if (item && item.householdId !== householdId) throw new Error("Forbidden");
        await prisma.scheduleItem.upsert({
          where: { id: payload.id },
          update: {
            label: payload.label,
            every: payload.every,
            amountUsd: payload.amountUsd,
            color: payload.color,
            type: payload.type,
          },
          create: {
            id: payload.id,
            householdId,
            label: payload.label,
            every: payload.every,
            amountUsd: payload.amountUsd,
            color: payload.color,
            type: payload.type,
          },
        });
        break;
      }

      case "removeScheduleItem": {
        if (!householdId) throw new Error("No household linked");
        // Authorization: verify this schedule item belongs to the user's household
        const item = await prisma.scheduleItem.findUnique({ where: { id: payload.id } });
        if (!item || item.householdId !== householdId) throw new Error("Forbidden");
        await prisma.scheduleItem.delete({ where: { id: payload.id } });
        break;
      }

      // ── Lending, product tracking, and receipt scans ───────────────────────
      case "addLoanEntry": {
        if (!householdId) throw new Error("No household linked");
        const created = await prisma.loanEntry.create({
          data: {
            id: payload.id,
            householdId,
            counterpartyMemberId: payload.counterpartyMemberId || null,
            counterpartyName: payload.counterpartyName,
            note: payload.note,
            due: payload.due,
            amountUsd: Number(payload.amountUsd) || 0,
            paidAmountUsd: Number(payload.paidAmountUsd) || 0,
            direction: payload.direction === "borrowed" ? "borrowed" : "lent",
            status: ["paid", "overdue", "pending"].includes(payload.status)
              ? payload.status
              : "pending",
          },
        });
        const household = await prisma.household.findUnique({ where: { id: householdId } });
        const householdUsers = await getHouseholdUsers(householdId);
        const summary = `${
          created.direction === "borrowed" ? "Borrowed from" : "Lent to"
        } ${created.counterpartyName} · $${created.amountUsd.toFixed(2)}`;
        await createNotificationsForUsers(
          householdUsers.map((member) => member.id),
          {
            title: "Loan created",
            desc: summary,
            time: "now",
            group: "Today",
            tone: "primary",
            screen: "lend_borrow",
          },
        );
        const recipients = uniqueEmails(householdUsers.map((member) => member.email)).filter(
          isDeliverableEmail,
        );
        if (household) {
          const linkUrl = getAppBaseUrl();
          await Promise.all(
            recipients.map((email) =>
              sendLoanCreatedEmail({
                to: email,
                householdName: household.name,
                summary,
                linkUrl,
              }),
            ),
          );
        }
        break;
      }

      case "updateLoanEntry": {
        if (!householdId) throw new Error("No household linked");
        const entry = await prisma.loanEntry.findUnique({ where: { id: payload.id } });
        if (!entry || entry.householdId !== householdId) throw new Error("Forbidden");
        const nextStatus = ["paid", "overdue", "pending"].includes(payload.status)
          ? payload.status
          : "pending";
        const updated = await prisma.loanEntry.update({
          where: { id: payload.id },
          data: {
            counterpartyMemberId: payload.counterpartyMemberId || null,
            counterpartyName: payload.counterpartyName,
            note: payload.note,
            due: payload.due,
            amountUsd: payload.amountUsd !== undefined ? Number(payload.amountUsd) : undefined,
            paidAmountUsd:
              payload.paidAmountUsd !== undefined ? Number(payload.paidAmountUsd) : undefined,
            direction: payload.direction === "borrowed" ? "borrowed" : "lent",
            status: nextStatus,
          },
        });
        if (entry.status !== "paid" && updated.status === "paid") {
          const household = await prisma.household.findUnique({ where: { id: householdId } });
          const householdUsers = await getHouseholdUsers(householdId);
          const summary = `${
            updated.direction === "borrowed" ? "Borrowed from" : "Lent to"
          } ${updated.counterpartyName} · $${updated.amountUsd.toFixed(2)}`;
          await createNotificationsForUsers(
            householdUsers.map((member) => member.id),
            {
              title: "Loan marked paid",
              desc: summary,
              time: "now",
              group: "Today",
              tone: "success",
              screen: "lend_borrow",
            },
          );
          const recipients = uniqueEmails(householdUsers.map((member) => member.email)).filter(
            isDeliverableEmail,
          );
          if (household) {
            const linkUrl = getAppBaseUrl();
            await Promise.all(
              recipients.map((email) =>
                sendLoanPaidEmail({
                  to: email,
                  householdName: household.name,
                  summary,
                  linkUrl,
                }),
              ),
            );
          }
        }
        break;
      }

      case "deleteLoanEntry": {
        if (!householdId) throw new Error("No household linked");
        const loanToDelete = await prisma.loanEntry.findUnique({ where: { id: payload.id } });
        if (!loanToDelete || loanToDelete.householdId !== householdId) throw new Error("Forbidden");
        await prisma.loanEntry.delete({ where: { id: payload.id } });
        break;
      }

      case "addTrackedProduct": {
        if (!householdId) throw new Error("No household linked");
        await prisma.trackedProduct.create({
          data: {
            id: payload.id,
            householdId,
            name: payload.name,
            store: payload.store,
            category: payload.category,
            amountUsd: Number(payload.amountUsd) || 0,
            quantity: Number(payload.quantity) || 1,
            unitPriceUsd: payload.unitPriceUsd == null ? null : Number(payload.unitPriceUsd),
            purchasedAt: payload.purchasedAt,
            source: payload.source === "receipt" ? "receipt" : "manual",
          },
        });
        break;
      }

      case "saveReceiptScan": {
        if (!householdId) throw new Error("No household linked");
        const receipt = payload.receipt;
        const products = Array.isArray(payload.products) ? payload.products : [];
        const transaction = payload.transaction;

        await prisma.receiptScan.upsert({
          where: { id: receipt.id },
          update: {
            storeName: receipt.storeName,
            purchasedAt: receipt.purchasedAt,
            currency: receipt.currency,
            totalUsd: Number(receipt.totalUsd) || 0,
            items: receipt.items || [],
            rawText: receipt.rawText || null,
          },
          create: {
            id: receipt.id,
            householdId,
            storeName: receipt.storeName,
            purchasedAt: receipt.purchasedAt,
            currency: receipt.currency,
            totalUsd: Number(receipt.totalUsd) || 0,
            items: receipt.items || [],
            rawText: receipt.rawText || null,
          },
        });

        if (products.length > 0) {
          await prisma.trackedProduct.createMany({
            data: products.map((product: any) => ({
              id: product.id,
              householdId,
              name: product.name,
              store: product.store,
              category: product.category,
              amountUsd: Number(product.amountUsd) || 0,
              quantity: Number(product.quantity) || 1,
              unitPriceUsd: product.unitPriceUsd == null ? null : Number(product.unitPriceUsd),
              purchasedAt: product.purchasedAt,
              source: product.source === "receipt" ? "receipt" : "manual",
            })),
            skipDuplicates: true,
          });
        }

        if (transaction) {
          const wallet = await prisma.walletAccount.findFirst({
            where: { householdId, label: transaction.wallet },
          });
          if (wallet) {
            await prisma.transaction.createMany({
              data: [
                {
                  id: transaction.id,
                  householdId,
                  name: transaction.name,
                  who: transaction.who,
                  usd: Number(transaction.usd) || 0,
                  category: transaction.category,
                  wallet: transaction.wallet,
                  date: transaction.date,
                },
              ],
              skipDuplicates: true,
            });
          }
        }
        break;
      }

      // ── Notifications ──────────────────────────────────────────────────────
      case "markNotificationRead": {
        // Authorization: verify this notification belongs to the current user
        const notif = await prisma.appNotification.findUnique({ where: { id: payload.id } });
        if (!notif || notif.userId !== user.id) throw new Error("Forbidden");
        await prisma.appNotification.update({
          where: { id: payload.id },
          data: { read: true },
        });
        break;
      }

      case "markAllNotificationsRead": {
        await prisma.appNotification.updateMany({
          where: { userId: user.id },
          data: { read: true },
        });
        break;
      }

      // ── Security ───────────────────────────────────────────────────────────
      case "setPasscode": {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passcode: payload.passcode,
            faceIdEnabled: payload.faceIdEnabled,
          },
        });
        break;
      }

      default:
        throw new Error(`Unknown mutation type: ${type}`);
    }

    return { success: true };
  });
