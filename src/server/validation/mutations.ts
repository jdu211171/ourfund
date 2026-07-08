import { z } from 'zod'

export const transactionLegSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  who: z.string().optional(),
  usd: z.number(),
  category: z.string().optional(),
  wallet: z.string().optional(),
  date: z.string().optional()
})

export const addTransactionSchema = transactionLegSchema

export const updateTransactionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  who: z.string().optional(),
  usd: z.number().optional(),
  category: z.string().optional(),
  wallet: z.string().optional(),
  date: z.string().optional()
})

export const deleteTransactionSchema = z.object({ id: z.string() })

export const deleteContributionsSchema = z.object({
  goalId: z.string(),
  contributionIds: z.array(z.string()).optional(),
  transactionIds: z.array(z.string()).optional()
})

export const recordTransferSchema = z.object({
  transactions: z.array(transactionLegSchema).min(2).max(2)
})

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

export const updateGoalSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  targetUsd: z.number().optional(),
  targetDate: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  contributors: z.array(z.any()).optional()
})

export const updateGoalSavingsSchema = z.object({
  id: z.string(),
  savedUsd: z.number(),
  history: z.array(z.any())
})
