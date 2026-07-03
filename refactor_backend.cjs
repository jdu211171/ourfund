const fs = require('fs')
const path = require('path')

const WORKSPACE = '/Users/muhammadnurislomtukhtamishhoji-zoda/Development/ourfund'
const SRC = path.join(WORKSPACE, 'src')

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Ensure all target directories exist
ensureDirExists(path.join(SRC, 'types'))
ensureDirExists(path.join(SRC, 'context', 'helpers'))
ensureDirExists(path.join(SRC, 'server', 'helpers'))
ensureDirExists(path.join(SRC, 'server', 'mutations'))
ensureDirExists(path.join(SRC, 'server', 'fns'))
ensureDirExists(path.join(SRC, 'lib', 'seed'))
ensureDirExists(path.join(SRC, 'lib', 'translations'))

console.log('Target directories verified.')

// Load source files
const navigationContent = fs.readFileSync(path.join(SRC, 'lib', 'navigation.tsx'), 'utf8')
const serverFnsContent = fs.readFileSync(path.join(SRC, 'lib', 'server-fns.ts'), 'utf8')
const seedContent = fs.readFileSync(path.join(SRC, 'lib', 'seed.ts'), 'utf8')
const translationsContent = fs.readFileSync(path.join(SRC, 'lib', 'translations.ts'), 'utf8')

console.log('Source files loaded.')

// ==========================================
// UTILITY: ROBUST BRACE/BRACKET MATCHING
// ==========================================
function getBracedBlock(content, startIndex) {
  let index = startIndex
  let braceCount = 0
  let foundStart = false
  let inString = false
  let stringChar = null
  let inLineComment = false
  let inBlockComment = false

  while (index < content.length) {
    const char = content[index]
    const prevChar = content[index - 1]
    const nextChar = content[index + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
      }
      index++
      continue
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false
        index += 2
        continue
      }
      index++
      continue
    }

    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false
      }
      index++
      continue
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true
      index += 2
      continue
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true
      index += 2
      continue
    }

    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      inString = true
      stringChar = char
      index++
      continue
    }

    if (char === '{') {
      braceCount++
      foundStart = true
    } else if (char === '}') {
      braceCount--
    }

    index++
    if (foundStart && braceCount === 0) {
      break
    }
  }
  return content.substring(startIndex, index)
}

// Find matching parentheses for the function parameter list, then find '{'
function findFunctionBodyBrace(content, startIndex) {
  let index = startIndex
  let parenCount = 0
  let foundParen = false
  let inString = false
  let stringChar = null
  let inLineComment = false
  let inBlockComment = false

  while (index < content.length) {
    const char = content[index]
    const prevChar = content[index - 1]
    const nextChar = content[index + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
      }
      index++
      continue
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false
        index += 2
        continue
      }
      index++
      continue
    }

    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false
      }
      index++
      continue
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true
      index += 2
      continue
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true
      index += 2
      continue
    }

    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      inString = true
      stringChar = char
      index++
      continue
    }

    if (char === '(') {
      parenCount++
      foundParen = true
    } else if (char === ')') {
      parenCount--
    }

    index++
    if (foundParen && parenCount === 0) {
      break
    }
  }

  // Now find the first '{' after the closing parenthesis
  const openBraceIdx = content.indexOf('{', index)
  return openBraceIdx
}

// Helper to extract a block starting with type/interface declaration
function extractBlock(content, name, kind = 'type') {
  const regex = new RegExp('(?:export\\s+)?' + kind + '\\s+' + name + '\\b')
  const match = content.match(regex)
  if (!match) {
    throw new Error('Failed to find ' + kind + ' ' + name)
  }
  const startIndex = match.index

  // For types that are union types (not objects with braces)
  if (kind === 'type' && !content.substring(startIndex, startIndex + 200).includes('{')) {
    // Find next semicolon
    const semiIndex = content.indexOf(';', startIndex)
    return content.substring(startIndex, semiIndex + 1)
  }

  const openBraceIdx = content.indexOf('{', startIndex)
  if (openBraceIdx === -1) {
    throw new Error('Failed to find opening brace for ' + kind + ' ' + name)
  }

  const braceBlock = getBracedBlock(content, openBraceIdx)
  return content.substring(startIndex, openBraceIdx) + braceBlock
}

// Helper to extract function
function extractFunction(content, name, isExported = false) {
  const prefix = isExported ? 'export\\s+(?:async\\s+)?function' : '(?:async\\s+)?function'
  const regex = new RegExp('(?:' + prefix + ')\\s+' + name + '\\b')
  const match = content.match(regex)
  if (!match) {
    throw new Error('Failed to find function ' + name)
  }
  const startIndex = match.index
  const openBraceIdx = findFunctionBodyBrace(content, startIndex)
  if (openBraceIdx === -1) {
    throw new Error('Failed to find opening brace for function ' + name)
  }
  const braceBlock = getBracedBlock(content, openBraceIdx)
  return content.substring(startIndex, openBraceIdx) + braceBlock
}

// Helper to extract case statement block from switch(type)
function getMutationCaseBody(content, caseName) {
  const match = content.match(new RegExp('case\\s+"' + caseName + '":\\s*\\{'))
  if (!match) {
    throw new Error('Failed to find case ' + caseName)
  }
  const openBraceIdx = match.index + match[0].length - 1 // start from '{'
  const block = getBracedBlock(content, openBraceIdx)
  // Strip outer braces
  let inner = block
    .trim()
    .substring(1, block.length - 1)
    .trim()
  // Strip trailing "break;" or return statement at the end of the case
  inner = inner.replace(/\bbreak\s*;\s*$/, '').trim()
  // Replace standalone break; statements with return; (safe since no loops use break; inside mutations)
  inner = inner.replace(/\bbreak\s*;/g, 'return;')
  return inner
}

// Extraction helper for createServerFn declarations
function extractServerFnDeclaration(content, fnName) {
  const match = content.match(new RegExp('export\\s+const\\s+' + fnName + '\\b'))
  if (!match) {
    throw new Error('Failed to find server fn ' + fnName)
  }
  const startIndex = match.index
  let index = startIndex
  let braceCount = 0
  let parenCount = 0
  let bracketCount = 0
  let foundStart = false
  let inString = false
  let stringChar = null
  let inLineComment = false
  let inBlockComment = false

  while (index < content.length) {
    const char = content[index]
    const prevChar = content[index - 1]
    const nextChar = content[index + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
      }
      index++
      continue
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false
        index += 2
        continue
      }
      index++
      continue
    }

    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false
      }
      index++
      continue
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true
      index += 2
      continue
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true
      index += 2
      continue
    }

    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      inString = true
      stringChar = char
      index++
      continue
    }

    if (char === '{') {
      braceCount++
      foundStart = true
    } else if (char === '}') {
      braceCount--
    } else if (char === '(') {
      parenCount++
      foundStart = true
    } else if (char === ')') {
      parenCount--
    } else if (char === '[') {
      bracketCount++
      foundStart = true
    } else if (char === ']') {
      bracketCount--
    } else if (char === ';') {
      if (foundStart && braceCount === 0 && parenCount === 0 && bracketCount === 0) {
        index++ // include semicolon
        break
      }
    }
    index++
  }
  return content.substring(startIndex, index)
}

// Helper to extract clean variable assignments
function extractVariable(content, name, kind = 'const') {
  const match = content.match(new RegExp('(?:export\\s+)?' + kind + '\\s+' + name + '\\b'))
  if (!match) {
    throw new Error('Failed to find variable ' + name)
  }
  // Find start of "kind" (const/let)
  const startOfKind = match[0].indexOf(kind)
  const startIndex = match.index + startOfKind
  let index = startIndex

  // Find the '=' sign first to skip any type annotations with brackets/braces
  const eqIndex = content.indexOf('=', index)
  if (eqIndex === -1) {
    const semiIndex = content.indexOf(';', index)
    const lineEndIndex = content.indexOf('\n', index)
    const endIndex = semiIndex !== -1 && semiIndex < lineEndIndex ? semiIndex + 1 : lineEndIndex
    return content.substring(startIndex, endIndex)
  }

  // Start scanning AFTER the = sign
  index = eqIndex + 1
  let braceCount = 0
  let braceSqCount = 0
  let foundStart = false
  let inString = false
  let stringChar = null
  let inLineComment = false
  let inBlockComment = false

  while (index < content.length) {
    const char = content[index]
    const prevChar = content[index - 1]
    const nextChar = content[index + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
      }
      index++
      continue
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false
        index += 2
        continue
      }
      index++
      continue
    }

    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false
      }
      index++
      continue
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true
      index += 2
      continue
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true
      index += 2
      continue
    }

    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      inString = true
      stringChar = char
      index++
      continue
    }

    if (char === '{') {
      braceCount++
      foundStart = true
    } else if (char === '}') {
      braceCount--
    } else if (char === '[') {
      braceSqCount++
      foundStart = true
    } else if (char === ']') {
      braceSqCount--
    }

    index++
    if (foundStart && braceCount === 0 && braceSqCount === 0) {
      const semiIndex = content.indexOf(';', index)
      const lineEndIndex = content.indexOf('\n', index)
      index = semiIndex !== -1 && semiIndex < lineEndIndex ? semiIndex + 1 : index
      break
    }
  }
  return content.substring(startIndex, index)
}

// ==========================================
// STEP 1: EXTRACT TYPES FROM navigation.tsx
// ==========================================
console.log('Step 1: Extracting types...')

const types = {}

types.core = `
export type ScreenName =
  | "onboarding"
  | "login"
  | "signup"
  | "reset_password"
  | "join_family"
  | "join_family_error"
  | "confirm_invite"
  | "home"
  | "more"
  | "wallet"
  | "new_wallet"
  | "wallet_switcher"
  | "wallet_detail"
  | "connect_bank"
  | "plaid_connecting"
  | "plaid_success"
  | "categories"
  | "new_category"
  | "subscriptions"
  | "recurring_income"
  | "new_goal"
  | "goal_detail"
  | "monthly_history"
  | "edit_goal"
  | "goal_withdraw"
  | "goal_achieved"
  | "reports_week"
  | "reports_month"
  | "reports_year"
  | "analytics"
  | "alerts"
  | "family"
  | "invite_member"
  | "permissions"
  | "allowance"
  | "settings"
  | "edit_profile"
  | "passcode"
  | "notif_prefs"
  | "currency"
  | "empty_history"
  | "remove_member"
  | "add_expense"
  | "add_income"
  | "transfer"
  | "expense_detail"
  | "income_detail"
  | "edit_expense"
  | "delete_confirm"
  | "delete_goal_confirm"
  | "filter_sort"
  | "receipt"
  | "history_search"
  | "lend_borrow"
  | "calc_salary"
  | "product_tracker"
  | "scan_receipt";

export type BudgetMode = "personal" | "family";
export type SalaryCalculationPeriod = "monthly" | "annual";
export type ReportPeriod = "Week" | "Month" | "Year";
export type CurrencyCode =
  | "UZS"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "JPY"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "MXN"
  | "BRL";
export type WalletType = "shared" | "private" | "connected";
export type MemberRole = "Admin" | "Adult" | "Teen" | "Kid";
export type NotificationTone = "success" | "danger" | "warn" | "primary";
export type TxnKind = "All" | "Expense" | "Income" | "Goals" | "Transfer";
export type LoanDirection = "lent" | "borrowed";
export type LoanStatus = "pending" | "paid" | "overdue";
`

types.domain = `import { CurrencyCode, WalletType, LoanDirection, LoanStatus } from './core';

${extractBlock(navigationContent, 'Transaction', 'interface')}

${extractBlock(navigationContent, 'WalletAccount', 'interface')}

${extractBlock(navigationContent, 'BudgetCategory', 'interface')}

${extractBlock(navigationContent, 'ScheduleItem', 'interface')}

${extractBlock(navigationContent, 'LoanEntry', 'interface')}

${extractBlock(navigationContent, 'ProductEntry', 'interface')}
`

types.household = `import { MemberRole, CurrencyCode } from './core';

${extractBlock(navigationContent, 'FamilyMember', 'interface')}

${extractBlock(navigationContent, 'Household', 'interface')}

${extractBlock(navigationContent, 'HouseholdInvite', 'interface')}
`

types.receipt = `import { CurrencyCode } from './core';

${extractBlock(navigationContent, 'ReceiptScanItem', 'interface')}

${extractBlock(navigationContent, 'ReceiptScan', 'interface')}
`

types.notifications = `import { NotificationTone, ScreenName } from './core';

${extractBlock(navigationContent, 'AppNotification', 'interface')}
`

types.filters = `import { TxnKind } from './core';

${extractBlock(navigationContent, 'HistoryFilters', 'interface')}
`

types.profile = `import { CurrencyCode } from './core';

${extractBlock(navigationContent, 'Profile', 'interface')}

${extractBlock(navigationContent, 'CurrencySettings', 'interface')}
`

types.salary = `import { SalaryCalculationPeriod } from './core';

${extractBlock(navigationContent, 'SalaryCalculatorSettings', 'interface')}
`

types.goal = `${extractBlock(navigationContent, 'Goal', 'interface')}
`

types.bank = `${extractBlock(navigationContent, 'LinkedBank', 'interface')}
`

types.seed = `import {
  BudgetMode,
  SalaryCalculatorSettings,
  ReportPeriod,
  Profile,
  Household,
  CurrencySettings,
  Transaction,
  WalletAccount,
  BudgetCategory,
  Goal,
  FamilyMember,
  LinkedBank,
  AppNotification,
  ScheduleItem,
  LoanEntry,
  ProductEntry,
  ReceiptScan,
  HistoryFilters,
} from './index';

${extractBlock(navigationContent, 'AppSeed', 'interface')}
`

types.index = `export * from './core';
export * from './domain';
export * from './household';
export * from './receipt';
export * from './notifications';
export * from './filters';
export * from './profile';
export * from './salary';
export * from './goal';
export * from './bank';
export * from './seed';
`

// Write type files
Object.entries(types).forEach(([name, content]) => {
  fs.writeFileSync(path.join(SRC, 'types', name + '.ts'), content.trim() + '\n', 'utf8')
})

console.log('Types extracted successfully.')

// ==========================================
// STEP 2: EXTRACT CONTEXT HELPERS FROM navigation.tsx
// ==========================================
console.log('Step 2: Extracting context helpers...')

const helpers = {}

helpers.ids = `
export ${extractFunction(navigationContent, 'makeId', false)}

export ${extractFunction(navigationContent, 'makeInviteCode', false)}

export ${extractFunction(navigationContent, 'initialsFor', false)}
`

helpers.permissions = `import { MemberRole } from '../../types/core';
import { defaultPermissions } from '../../lib/seed';

export ${extractFunction(navigationContent, 'permissionsForRole', false)}
`

helpers.categories = `
export ${extractFunction(navigationContent, 'categoryAliases', false)}

export ${extractFunction(navigationContent, 'iconForCategoryLabel', false)}
`

helpers.dates = `import { Transaction } from '../../types/domain';

export ${extractFunction(navigationContent, 'plusDays', false)}

export ${extractFunction(navigationContent, 'firstName', false)}

${extractFunction(navigationContent, 'transactionDate', true)}

export ${extractFunction(navigationContent, 'isCurrentMonthTransaction', false)}
`

helpers.normalize = `import { BudgetMode, ReportPeriod, TxnKind } from '../../types/core';
import { HistoryFilters } from '../../types/filters';
import { Goal } from '../../types/goal';
import { defaultHistoryFilters } from '../../lib/seed';

export ${extractFunction(navigationContent, 'asRecord', false)}

export ${extractFunction(navigationContent, 'normalizeBudgetModeInput', false)}

export ${extractFunction(navigationContent, 'normalizeReportPeriodInput', false)}

export ${extractFunction(navigationContent, 'normalizeHistoryFiltersInput', false)}

export ${extractFunction(navigationContent, 'canMemberSeeGoal', false)}
`

helpers.index = `export * from './ids';
export * from './permissions';
export * from './categories';
export * from './dates';
export * from './normalize';
`

// Write context helpers
Object.entries(helpers).forEach(([name, content]) => {
  fs.writeFileSync(
    path.join(SRC, 'context', 'helpers', name + '.ts'),
    content.trim() + '\n',
    'utf8'
  )
})

console.log('Context helpers extracted successfully.')

// ==========================================
// STEP 3: CREATE CONTEXT AND APP NAVIGATION PROVIDER
// ==========================================
console.log('Step 3: Creating context and provider index.tsx...')

const providerOpenBrace = findFunctionBodyBrace(
  navigationContent,
  navigationContent.indexOf('AppNavigationProvider')
)
const providerBracedBlock = getBracedBlock(navigationContent, providerOpenBrace)
const navigationContextTypeBlock = extractBlock(
  navigationContent,
  'NavigationContextType',
  'interface'
)

const contextIndexContent = `import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  clearPersistedAppSeed,
  defaultHistoryFilters,
  defaultPermissions,
  getEmptySeed,
  getInitialSeed,
  knownInvites,
  persistAppSeed,
} from "../lib/seed";
import {
  checkEmailRegisteredServerFn,
  getAppDataServerFn,
  logoutServerFn,
  scanReceiptServerFn,
  syncMutationServerFn,
  validateInviteCodeServerFn,
} from "../server/index";
import { setCompactMoneyMode as setCompactMoneyFormatterMode } from "../lib/currency";
import { formatISODate, makeScheduleMeta, nextDateFromWeekday } from "../lib/schedules";

// Import types
import {
  ScreenName,
  BudgetMode,
  SalaryCalculationPeriod,
  ReportPeriod,
  CurrencyCode,
  WalletType,
  MemberRole,
  NotificationTone,
  TxnKind,
  LoanDirection,
  LoanStatus,
  Transaction,
  WalletAccount,
  BudgetCategory,
  ScheduleItem,
  LoanEntry,
  ProductEntry,
  FamilyMember,
  Household,
  HouseholdInvite,
  ReceiptScanItem,
  ReceiptScan,
  AppNotification,
  HistoryFilters,
  Profile,
  CurrencySettings,
  SalaryCalculatorSettings,
  Goal,
  LinkedBank,
  AppSeed,
} from "../types";

// Import helpers
import {
  makeId,
  makeInviteCode,
  initialsFor,
  permissionsForRole,
  categoryAliases,
  iconForCategoryLabel,
  plusDays,
  firstName,
  transactionDate,
  isCurrentMonthTransaction,
  asRecord,
  normalizeBudgetModeInput,
  normalizeReportPeriodInput,
  normalizeHistoryFiltersInput,
  canMemberSeeGoal,
} from "./helpers";

export ${navigationContextTypeBlock}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function AppNavigationProvider({ children }: { children: ReactNode }) ${providerBracedBlock}

export function useOptionalAppNavigation() {
  return useContext(NavigationContext);
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useAppNavigation must be used within an AppNavigationProvider");
  }
  return context;
}
`

fs.writeFileSync(path.join(SRC, 'context', 'index.tsx'), contextIndexContent.trim() + '\n', 'utf8')
console.log('src/context/index.tsx created.')

// ==========================================
// STEP 4: EXTRACT SERVER HELPERS FROM server-fns.ts
// ==========================================
console.log('Step 4: Extracting server helpers...')

const serverHelpers = {}

serverHelpers.ids = `
export ${extractFunction(serverFnsContent, 'makeServerId', false)}
`

serverHelpers.normalize = `import { currencyMeta } from '../../lib/currency';

export const defaultNotificationPrefs = {
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

export const defaultHistoryFilters = {
  kind: "All",
  member: "Anyone",
  categories: [],
  sort: "Newest",
  minUsd: 0,
  maxUsd: 5000,
};

export ${extractFunction(serverFnsContent, 'asRecord', false)}

export ${extractFunction(serverFnsContent, 'normalizeBudgetMode', false)}

export ${extractFunction(serverFnsContent, 'normalizeReportPeriod', false)}

export ${extractFunction(serverFnsContent, 'normalizeHistoryFilters', false)}

export ${extractFunction(serverFnsContent, 'normalizeCurrencyCode', false)}
`

serverHelpers.product = `
export ${extractFunction(serverFnsContent, 'normalizeProductName', false)}
`

serverHelpers.email = `
export ${extractFunction(serverFnsContent, 'isDeliverableEmail', false)}

export ${extractFunction(serverFnsContent, 'uniqueEmails', false)}
`

serverHelpers.wallet = `
export ${extractFunction(serverFnsContent, 'walletMembers', false)}

export ${extractFunction(serverFnsContent, 'canUseWalletAsTransferSource', false)}

export ${extractFunction(serverFnsContent, 'canUseWalletAsTransferTarget', false)}
`

serverHelpers.goal = `
export ${extractFunction(serverFnsContent, 'canMemberSeeGoal', false)}
`

serverHelpers.notification = `import { prisma } from '../../lib/db';

export const loanEntrySelect = {
  id: true,
  householdId: true,
  counterpartyMemberId: true,
  counterpartyName: true,
  note: true,
  due: true,
  amountUsd: true,
  paidAmountUsd: true,
  direction: true,
  status: true,
  createdAt: true,
} as const;

export ${extractFunction(serverFnsContent, 'getHouseholdUsers', false)}

export ${extractFunction(serverFnsContent, 'createNotificationsForUsers', false)}
`

// Extract constants for Gemini
const TEMPORARY_RECEIPT_SCAN_ERROR_MATCH = serverFnsContent.match(
  /const TEMPORARY_RECEIPT_SCAN_ERROR\s*=\s*[^;]+;/
)
const DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS_MATCH = serverFnsContent.match(
  /const DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS\s*=\s*\[[^\]]+\];/
)

const tempScanErrorVal = TEMPORARY_RECEIPT_SCAN_ERROR_MATCH
  ? TEMPORARY_RECEIPT_SCAN_ERROR_MATCH[0].split('=').slice(1).join('=').trim()
  : '""'
const fallbackModelsVal = DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS_MATCH
  ? DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS_MATCH[0].split('=').slice(1).join('=').trim()
  : '[]'

serverHelpers.gemini = `
export const TEMPORARY_RECEIPT_SCAN_ERROR = ${tempScanErrorVal}

export const DEFAULT_GEMINI_RECEIPT_SCAN_FALLBACK_MODELS = ${fallbackModelsVal}

export ${extractFunction(serverFnsContent, 'splitGeminiModelList', false)}

export ${extractFunction(serverFnsContent, 'getReceiptScanModels', false)}

export ${extractFunction(serverFnsContent, 'isRetryableGeminiFailure', false)}

export ${extractFunction(serverFnsContent, 'isGeminiModelUnavailable', false)}

export ${extractFunction(serverFnsContent, 'receiptScanFailureMessage', false)}

export ${extractFunction(serverFnsContent, 'parseGeminiJson', false)}
`

serverHelpers.index = `export * from './ids';
export * from './normalize';
export * from './product';
export * from './email';
export * from './wallet';
export * from './goal';
export * from './notification';
export * from './gemini';
`

// Write server helpers
Object.entries(serverHelpers).forEach(([name, content]) => {
  fs.writeFileSync(path.join(SRC, 'server', 'helpers', name + '.ts'), content.trim() + '\n', 'utf8')
})

console.log('Server helpers extracted successfully.')

// ==========================================
// STEP 5: EXTRACT MUTATIONS FROM server-fns.ts
// ==========================================
console.log('Step 5: Extracting mutations...')

const mutations = {
  profile: `import { prisma } from '../../lib/db';
export async function handleUpdateProfile(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateProfile')}
}`,

  settings: `import { prisma } from '../../lib/db';
import { normalizeReportPeriod, normalizeHistoryFilters, defaultNotificationPrefs, asRecord } from '../helpers/normalize';
export async function handleSetBudgetMode(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setBudgetMode')}
}

export async function handleSetReportPeriod(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setReportPeriod')}
}

export async function handleSetNotificationPrefs(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setNotificationPrefs')}
}

export async function handleSetHistoryFilters(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setHistoryFilters')}
}

export async function handleSetCompactMoneyMode(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setCompactMoneyMode')}
}

export async function handleSetCurrencyForMode(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setCurrencyForMode')}
}

export async function handleSetPasscode(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'setPasscode')}
}`,

  household: `import { prisma } from '../../lib/db';
import { getHouseholdUsers, createNotificationsForUsers } from '../helpers/notification';
export async function handleCreateHousehold(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'createHousehold')}
}

export async function handleAcceptInvite(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'acceptInvite')}
}

export async function handleValidateInviteCode(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'validateInviteCode')}
}`,

  members: `import { prisma } from '../../lib/db';
import { isDeliverableEmail } from '../helpers/email';
import { sendInviteEmail } from '../../lib/mailer';
export async function handleInviteMember(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'inviteMember')}
}

export async function handleUpdateMember(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateMember')}
}

export async function handleRemoveMember(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'removeMember')}
}`,

  transactions: `import { prisma } from '../../lib/db';
import { walletMembers, canUseWalletAsTransferSource, canUseWalletAsTransferTarget } from '../helpers/wallet';
export async function handleAddTransaction(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addTransaction')}
}

export async function handleUpdateTransaction(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateTransaction')}
}

export async function handleDeleteTransaction(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'deleteTransaction')}
}

export async function handleDeleteContributions(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'deleteContributions')}
}

export async function handleRecordTransfer(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'recordTransfer')}
}`,

  wallets: `import { prisma } from '../../lib/db';
export async function handleAddWallet(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addWallet')}
}

export async function handleUpdateWallet(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateWallet')}
}

export async function handleDeleteWallet(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'deleteWallet')}
}`,

  categories: `import { prisma } from '../../lib/db';
export async function handleAddCategory(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addCategory')}
}

export async function handleUpdateCategory(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateCategory')}
}

export async function handleUpdateCategoryLimit(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateCategoryLimit')}
}

export async function handleDeleteCategory(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'deleteCategory')}
}`,

  goals: `import { prisma } from '../../lib/db';
export async function handleAddGoal(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addGoal')}
}

export async function handleUpdateGoal(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateGoal')}
}

export async function handleUpdateGoalSavings(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateGoalSavings')}
}

export async function handleDeleteGoal(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'deleteGoal')}
}`,

  schedule: `import { prisma } from '../../lib/db';
export async function handleAddScheduleItem(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addScheduleItem')}
}

export async function handleUpdateScheduleItem(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateScheduleItem')}
}

export async function handleRemoveScheduleItem(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'removeScheduleItem')}
}

export async function handleRemoveScheduleItems(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'removeScheduleItems')}
}`,

  loans: `import { prisma } from '../../lib/db';
import { getAppBaseUrl, sendInviteEmail, sendLoanCreatedEmail, sendLoanPaidEmail } from '../../lib/mailer';
import { getHouseholdUsers, createNotificationsForUsers, loanEntrySelect, uniqueEmails, isDeliverableEmail } from '../helpers';
export async function handleAddLoanEntry(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addLoanEntry')}
}

export async function handleUpdateLoanEntry(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'updateLoanEntry')}
}

export async function handleDeleteLoanEntry(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'deleteLoanEntry')}
}`,

  products: `import { prisma } from '../../lib/db';
import { normalizeProductName } from '../helpers/product';
export async function handleAddTrackedProduct(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'addTrackedProduct')}
}`,

  receipts: `import { prisma } from '../../lib/db';
export async function handleSaveReceiptScan(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'saveReceiptScan')}
}`,

  notifications: `import { prisma } from '../../lib/db';
export async function handleMarkNotificationRead(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'markNotificationRead')}
}

export async function handleMarkAllNotificationsRead(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'markAllNotificationsRead')}
}`,

  banks: `import { prisma } from '../../lib/db';
export async function handleConnectSelectedBank(payload: any, user: any, member: any, householdId: string | undefined) {
  ${getMutationCaseBody(serverFnsContent, 'connectSelectedBank')}
}`
}

// Write mutations domain files
Object.entries(mutations).forEach(([name, content]) => {
  fs.writeFileSync(
    path.join(SRC, 'server', 'mutations', name + '.ts'),
    content.trim() + '\n',
    'utf8'
  )
})

// Write mutations index barrel file
const mutationsIndexContent = Object.keys(mutations)
  .map(name => "export * from './" + name + "';")
  .join('\n')
fs.writeFileSync(
  path.join(SRC, 'server', 'mutations', 'index.ts'),
  mutationsIndexContent + '\n',
  'utf8'
)

console.log('Mutations extracted successfully.')

// ==========================================
// STEP 6: EXTRACT SERVER FUNCTIONS
// ==========================================
console.log('Step 6: Extracting server functions...')

const serverFns = {}

serverFns.auth = `import { createServerFn } from '@tanstack/react-start';
import { setResponseHeaders } from '@tanstack/react-start/server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db';
import { getSessionUser, createSessionCookie, createSessionCookie as createSessionCookieImport, clearSessionCookie, verifyGoogleToken } from '../../lib/auth-server';
import { getAppBaseUrl, sendWelcomeEmail, sendPasswordResetEmail } from '../../lib/mailer';

${extractServerFnDeclaration(serverFnsContent, 'loginWithEmailServerFn')}

${extractServerFnDeclaration(serverFnsContent, 'signUpWithEmailServerFn')}

${extractServerFnDeclaration(serverFnsContent, 'loginWithGoogleServerFn')}

${extractServerFnDeclaration(serverFnsContent, 'checkEmailRegisteredServerFn')}

${extractServerFnDeclaration(serverFnsContent, 'logoutServerFn')}

${extractServerFnDeclaration(serverFnsContent, 'requestPasswordResetServerFn')}

${extractServerFnDeclaration(serverFnsContent, 'resetPasswordServerFn')}
`

serverFns['app-data'] = `import { createServerFn } from '@tanstack/react-start';
import { setResponseHeaders } from '@tanstack/react-start/server';
import { prisma } from '../../lib/db';
import { getSessionUser } from '../../lib/auth-server';
import { loanEntrySelect } from '../helpers/notification';
import { canMemberSeeGoal, normalizeBudgetMode, normalizeReportPeriod, defaultNotificationPrefs, asRecord, normalizeHistoryFilters } from '../helpers';

${extractServerFnDeclaration(serverFnsContent, 'getAppDataServerFn')}
`

serverFns.invite = `import { createServerFn } from '@tanstack/react-start';
import { prisma } from '../../lib/db';

${extractServerFnDeclaration(serverFnsContent, 'validateInviteCodeServerFn')}
`

serverFns['receipt-scan'] = `import { createServerFn } from '@tanstack/react-start';
import { prisma } from '../../lib/db';
import { getSessionUser } from '../../lib/auth-server';
import { currencyValueToUsd } from '../../lib/currency';
import { getReceiptScanModels, isRetryableGeminiFailure, isGeminiModelUnavailable, parseGeminiJson, receiptScanFailureMessage, TEMPORARY_RECEIPT_SCAN_ERROR, normalizeCurrencyCode, normalizeProductName, makeServerId } from '../helpers';

${extractServerFnDeclaration(serverFnsContent, 'scanReceiptServerFn')}
`

serverFns['sync-mutation'] = `import { createServerFn } from '@tanstack/react-start';
import { getSessionUser } from '../../lib/auth-server';
import * as mutations from '../mutations';

export const syncMutationServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: { type: string; data: any }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const member = user.householdMembers[0];
    const householdId = member?.householdId;

    const { type, data: payload } = data;

    switch (type) {
      // Profile
      case "updateProfile":
        return await mutations.handleUpdateProfile(payload, user, member, householdId);

      // Settings
      case "setBudgetMode":
        return await mutations.handleSetBudgetMode(payload, user, member, householdId);
      case "setReportPeriod":
        return await mutations.handleSetReportPeriod(payload, user, member, householdId);
      case "setNotificationPrefs":
        return await mutations.handleSetNotificationPrefs(payload, user, member, householdId);
      case "setHistoryFilters":
        return await mutations.handleSetHistoryFilters(payload, user, member, householdId);
      case "setCompactMoneyMode":
        return await mutations.handleSetCompactMoneyMode(payload, user, member, householdId);
      case "setCurrencyForMode":
        return await mutations.handleSetCurrencyForMode(payload, user, member, householdId);
      case "setPasscode":
        return await mutations.handleSetPasscode(payload, user, member, householdId);

      // Household setup
      case "createHousehold":
        return await mutations.handleCreateHousehold(payload, user, member, householdId);
      case "validateInviteCode":
        return await mutations.handleValidateInviteCode(payload, user, member, householdId);
      case "acceptInvite":
        return await mutations.handleAcceptInvite(payload, user, member, householdId);

      // Members
      case "inviteMember":
        return await mutations.handleInviteMember(payload, user, member, householdId);
      case "updateMember":
        return await mutations.handleUpdateMember(payload, user, member, householdId);
      case "removeMember":
        return await mutations.handleRemoveMember(payload, user, member, householdId);

      // Transactions
      case "addTransaction":
        return await mutations.handleAddTransaction(payload, user, member, householdId);
      case "updateTransaction":
        return await mutations.handleUpdateTransaction(payload, user, member, householdId);
      case "deleteTransaction":
        return await mutations.handleDeleteTransaction(payload, user, member, householdId);
      case "deleteContributions":
        return await mutations.handleDeleteContributions(payload, user, member, householdId);
      case "recordTransfer":
        return await mutations.handleRecordTransfer(payload, user, member, householdId);

      // Wallets
      case "addWallet":
        return await mutations.handleAddWallet(payload, user, member, householdId);
      case "updateWallet":
        return await mutations.handleUpdateWallet(payload, user, member, householdId);
      case "deleteWallet":
        return await mutations.handleDeleteWallet(payload, user, member, householdId);

      // Categories
      case "addCategory":
        return await mutations.handleAddCategory(payload, user, member, householdId);
      case "updateCategory":
        return await mutations.handleUpdateCategory(payload, user, member, householdId);
      case "updateCategoryLimit":
        return await mutations.handleUpdateCategoryLimit(payload, user, member, householdId);
      case "deleteCategory":
        return await mutations.handleDeleteCategory(payload, user, member, householdId);

      // Goals
      case "addGoal":
        return await mutations.handleAddGoal(payload, user, member, householdId);
      case "updateGoal":
        return await mutations.handleUpdateGoal(payload, user, member, householdId);
      case "updateGoalSavings":
        return await mutations.handleUpdateGoalSavings(payload, user, member, householdId);
      case "deleteGoal":
        return await mutations.handleDeleteGoal(payload, user, member, householdId);

      // Schedule
      case "addScheduleItem":
        return await mutations.handleAddScheduleItem(payload, user, member, householdId);
      case "updateScheduleItem":
        return await mutations.handleUpdateScheduleItem(payload, user, member, householdId);
      case "removeScheduleItem":
        return await mutations.handleRemoveScheduleItem(payload, user, member, householdId);
      case "removeScheduleItems":
        return await mutations.handleRemoveScheduleItems(payload, user, member, householdId);

      // Loans
      case "addLoanEntry":
        return await mutations.handleAddLoanEntry(payload, user, member, householdId);
      case "updateLoanEntry":
        return await mutations.handleUpdateLoanEntry(payload, user, member, householdId);
      case "deleteLoanEntry":
        return await mutations.handleDeleteLoanEntry(payload, user, member, householdId);

      // Products
      case "addTrackedProduct":
        return await mutations.handleAddTrackedProduct(payload, user, member, householdId);

      // Receipts
      case "saveReceiptScan":
        return await mutations.handleSaveReceiptScan(payload, user, member, householdId);

      // Notifications
      case "markNotificationRead":
        return await mutations.handleMarkNotificationRead(payload, user, member, householdId);
      case "markAllNotificationsRead":
        return await mutations.handleMarkAllNotificationsRead(payload, user, member, householdId);

      // Banks
      case "connectSelectedBank":
        return await mutations.handleConnectSelectedBank(payload, user, member, householdId);

      default:
        throw new Error("Unknown mutation type: " + type);
    }
  });
`

// Write server fns
Object.entries(serverFns).forEach(([name, content]) => {
  fs.writeFileSync(path.join(SRC, 'server', 'fns', name + '.ts'), content.trim() + '\n', 'utf8')
})

// Server fns index barrel
const serverFnsIndex = `export * from './auth';
export * from './app-data';
export * from './invite';
export * from './receipt-scan';
export * from './sync-mutation';
`
fs.writeFileSync(path.join(SRC, 'server', 'fns', 'index.ts'), serverFnsIndex.trim() + '\n', 'utf8')

// Server index barrel
const serverIndex = `export * from './fns';
export * from './helpers';
export * from './mutations';
`
fs.writeFileSync(path.join(SRC, 'server', 'index.ts'), serverIndex.trim() + '\n', 'utf8')

console.log('Server fns extracted successfully.')

// ==========================================
// STEP 7: SPLIT seed.ts INTO seed/
// ==========================================
console.log('Step 7: Splitting seed.ts...')

const seedSplit = {}

// Extract variables needed for defaults
seedSplit.defaults = `import {
  AppNotification,
  AppSeed,
  BudgetCategory,
  BudgetMode,
  CurrencyCode,
  FamilyMember,
  Goal,
  HistoryFilters,
  Household,
  HouseholdInvite,
  LinkedBank,
  LoanEntry,
  MemberRole,
  NotificationTone,
  ProductEntry,
  Profile,
  ReceiptScan,
  ReportPeriod,
  SalaryCalculatorSettings,
  ScheduleItem,
  Transaction,
  WalletAccount,
  WalletType,
} from '../../types';
import { buildScheduleEvery, formatISODate } from '../schedules';

const seedToday = new Date();
const addSeedDays = (base: Date, days: number) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
const seedISO = (date: Date) => formatISODate(date);

export function cloneSeed(seed: AppSeed): AppSeed {
  return JSON.parse(JSON.stringify(seed));
}

export ${extractVariable(seedContent, 'defaultPermissions', 'const')}

export ${extractVariable(seedContent, 'defaultHistoryFilters', 'const')}

export ${extractVariable(seedContent, 'notificationPrefs', 'const')}

export ${extractVariable(seedContent, 'defaultSalaryCalculatorSettings', 'const')}

export ${extractVariable(seedContent, 'demoTransactions', 'const')}
export ${extractVariable(seedContent, 'demoWallets', 'const')}
export ${extractVariable(seedContent, 'demoCategories', 'const')}
export ${extractVariable(seedContent, 'demoMembers', 'const')}
export ${extractVariable(seedContent, 'demoGoals', 'const')}
export ${extractVariable(seedContent, 'demoNotifications', 'const')}
export ${extractVariable(seedContent, 'demoRecurringIncome', 'const')}
export ${extractVariable(seedContent, 'demoSubscriptions', 'const')}
export ${extractVariable(seedContent, 'demoLoanEntries', 'const')}
export ${extractVariable(seedContent, 'demoTrackedProducts', 'const')}
export ${extractVariable(seedContent, 'demoReceiptScans', 'const')}

export ${extractVariable(seedContent, 'emptySeed', 'const')}

export ${extractVariable(seedContent, 'demoSeed', 'const')}

export const knownInvites: HouseholdInvite[] = import.meta.env.DEV
  ? [
      {
        code: "NEST-2840",
        householdName: "The Morgans",
        memberCount: 4,
        role: "Teen",
        inviter: "Emma Morgan",
        familyCurrency: "UZS",
      },
    ]
  : [];

export function getEmptySeed(): AppSeed {
  return cloneSeed(emptySeed);
}
`

// Extract functions needed for normalize
seedSplit.normalize = `import { AppSeed, SalaryCalculatorSettings } from '../../types';
import { defaultSalaryCalculatorSettings, emptySeed, cloneSeed } from './defaults';

export ${extractFunction(seedContent, 'normalizeSalaryCalculatorSettings', false)}

export ${extractFunction(seedContent, 'normalizeSeed', false)}
`

// Extract functions needed for storage
seedSplit.storage = `import { AppSeed } from '../../types';
import { demoSeed, emptySeed, cloneSeed } from './defaults';
import { normalizeSeed } from './normalize';

const STORAGE_KEY = "ourfund.appSeed.v1";

export ${extractFunction(seedContent, 'canUseStorage', false)}

export ${extractFunction(seedContent, 'persistAppSeed', false)}

export ${extractFunction(seedContent, 'getInitialSeed', false)}

export ${extractFunction(seedContent, 'clearPersistedAppSeed', false)}
`

seedSplit.index = `export * from './defaults';
export * from './normalize';
export * from './storage';
`

// Write seed split files
Object.entries(seedSplit).forEach(([name, content]) => {
  fs.writeFileSync(path.join(SRC, 'lib', 'seed', name + '.ts'), content.trim() + '\n', 'utf8')
})

console.log('seed.ts split successfully.')

// ==========================================
// STEP 8: SPLIT translations.ts INTO translations/
// ==========================================
console.log('Step 8: Splitting translations.ts...')

const translationsSplit = {}

// Clean duplicates from translations
function cleanJapaneseTranslations(translationsObj) {
  const lines = translationsObj.split('\n')
  const seenKeys = new Set()
  const cleanLines = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
      const keyMatch = trimmed.match(/^["']([^"']+)["']\s*:/)
      if (keyMatch) {
        const key = keyMatch[1]
        if (seenKeys.has(key)) {
          console.log('Removing duplicate key: ' + key)
          continue
        }
        seenKeys.add(key)
      }
    }
    cleanLines.push(line)
  }
  return cleanLines.join('\n')
}

// Find translations object inside translations.ts
const translationsStart = translationsContent.indexOf('{')
const translationsEnd = translationsContent.lastIndexOf('}')
const rawTranslationsObj = translationsContent.substring(translationsStart, translationsEnd + 1)
const cleanTranslationsObj = cleanJapaneseTranslations(rawTranslationsObj)

translationsSplit.ja = 'export const ja: Record<string, string> = ' + cleanTranslationsObj + ';\n'

translationsSplit.en =
  '// For English, we return the key itself\nexport const en: Record<string, string> = {};\n'

translationsSplit.index = [
  "import { ja } from './ja';",
  "import { en } from './en';",
  "import { useMemo } from 'react';",
  "import { useOptionalAppNavigation } from '../navigation';",
  '',
  'export { ja, en };',
  '',
  "export function translate(key: string, lang: 'en' | 'ja' = 'en'): string {",
  "  if (lang === 'ja' && ja[key]) {",
  '    return ja[key];',
  '  }',
  '  return key;',
  '}',
  '',
  'export function useTranslation() {',
  '  const nav = useOptionalAppNavigation();',
  "  const lang = nav?.language || 'en';",
  '',
  '  return {',
  '    t: (key: string) => translate(key, lang),',
  '    language: lang,',
  '  };',
  '}'
].join('\n')

// Write translations files
Object.entries(translationsSplit).forEach(([name, content]) => {
  fs.writeFileSync(
    path.join(SRC, 'lib', 'translations', name + '.ts'),
    content.trim() + '\n',
    'utf8'
  )
})

console.log('translations.ts split successfully.')

// ==========================================
// STEP 9: WRITE REDIRECT / BARREL FILES
// ==========================================
console.log('Step 9: Overwriting original files with thin barrels...')

const thinNavigation = `
export * from '../types';
export * from '../context/helpers';
export * from '../context';
`
fs.writeFileSync(path.join(SRC, 'lib', 'navigation.tsx'), thinNavigation.trim() + '\n', 'utf8')

const thinServerFns = `
export * from '../server/index';
`
fs.writeFileSync(path.join(SRC, 'lib', 'server-fns.ts'), thinServerFns.trim() + '\n', 'utf8')

const thinSeed = `
export * from './seed/index';
`
fs.writeFileSync(path.join(SRC, 'lib', 'seed.ts'), thinSeed.trim() + '\n', 'utf8')

const thinTranslations = `
export * from './translations/index';
`
fs.writeFileSync(path.join(SRC, 'lib', 'translations.ts'), thinTranslations.trim() + '\n', 'utf8')

console.log('Thin barrels written.')
console.log('All steps completed successfully!')
