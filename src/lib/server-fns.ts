/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import {
  getSessionUser,
  createSessionCookie,
  clearSessionCookie,
  verifyGoogleToken,
} from "./auth-server";

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
    return { success: true };
  });

export const loginWithGoogleServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { credential: string }) => d)
  .handler(async ({ data }) => {
    const { credential } = data;
    const googleProfile = await verifyGoogleToken(credential);
    let user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (!user) {
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
    return { success: true };
  });

export const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { success: true };
});

export const getAppDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
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

      // ── Household setup ────────────────────────────────────────────────────
      case "createHousehold": {
        const inviteCode = `NEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const personalCurrency = payload.personalCurrency || user.personalCurrency || "USD";
        const familyCurrency = payload.familyCurrency || "UZS";
        await prisma.user.update({
          where: { id: user.id },
          data: { personalCurrency },
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
          data: { personalCurrency },
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
        await prisma.familyMember.create({
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
        await prisma.scheduleItem.create({
          data: {
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
