// Validation schemas for mutation payloads (simple shapes)
import { z } from 'zod'

// One transaction leg in a transfer or add transaction
export const transactionLegSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  who: z.string().optional(),
  usd: z.number(),
  category: z.string().optional(),
  wallet: z.string().optional(),
  date: z.string().optional()
})

// Add transaction uses the same shape
export const addTransactionSchema = transactionLegSchema

// Update transaction: id required, other fields optional
export const updateTransactionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  who: z.string().optional(),
  usd: z.number().optional(),
  category: z.string().optional(),
  wallet: z.string().optional(),
  date: z.string().optional()
})

// Delete transaction requires id only
export const deleteTransactionSchema = z.object({ id: z.string() })

// Delete contributions: goal id plus optional lists of ids to remove
export const deleteContributionsSchema = z.object({
  goalId: z.string(),
  contributionIds: z.array(z.string()).optional(),
  transactionIds: z.array(z.string()).optional()
})

// Record transfer: exactly two transaction legs required
export const recordTransferSchema = z.object({
  transactions: z.array(transactionLegSchema).min(2).max(2)
})

// Create goal: required fields and optional extras
export const addGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetUsd: z.number(),
  savedUsd: z.number().optional(),
  targetDate: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  contributors: z.array(z.any()).optional(),
  history: z.array(z.any()).optional()
})

// Update goal: id required, others optional
export const updateGoalSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  targetUsd: z.number().optional(),
  targetDate: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  contributors: z.array(z.any()).optional()
})

// Update goal savings: requires id, savedUsd and history array
export const updateGoalSavingsSchema = z.object({
  id: z.string(),
  savedUsd: z.number(),
  history: z.array(z.any())
})
