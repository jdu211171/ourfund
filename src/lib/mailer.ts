import { getRequestHost, getRequestProtocol } from '@tanstack/react-start/server'
import nodemailer from 'nodemailer'

type MailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

type InviteMailPayload = {
  to: string
  inviterName: string
  householdName: string
  inviteCode: string
}

type WelcomeMailPayload = {
  to: string
  name: string
}

type PasswordResetMailPayload = {
  to: string
  name: string
  resetUrl: string
}

type LoanMailPayload = {
  to: string
  householdName: string
  summary: string
  linkUrl: string
}

let transporter: nodemailer.Transporter | null = null

function normalizeBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function isLocalBaseUrl(value: string) {
  try {
    const host = new URL(value).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

export function getAppBaseUrl() {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim()
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production'
    const host = getRequestHost({ xForwardedHost: trustProxy })
    const protocol = getRequestProtocol({ xForwardedProto: trustProxy })
    const requestBaseUrl = host ? normalizeBaseUrl(`${protocol}://${host}/ourfund`) : null

    if (
      configuredBaseUrl &&
      (!isProduction || !isLocalBaseUrl(configuredBaseUrl) || !requestBaseUrl)
    ) {
      return normalizeBaseUrl(configuredBaseUrl)
    }

    if (requestBaseUrl) return requestBaseUrl
  } catch {
    // Server-side jobs without request context can still use the local fallback.
  }

  if (configuredBaseUrl) return normalizeBaseUrl(configuredBaseUrl)

  return 'http://localhost:3000/ourfund'
}

function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.')
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })

  return transporter
}

export async function sendMail(payload: MailPayload) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  if (!from) {
    throw new Error('SMTP_FROM is not configured.')
  }
  const transport = getTransporter()
  await transport.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  })
}

export async function sendPasswordResetEmail(payload: PasswordResetMailPayload) {
  const subject = 'Reset your Nest password'
  const text = [
    `Hi ${payload.name},`,
    '',
    'We received a request to reset your Nest password.',
    `Reset it here: ${payload.resetUrl}`,
    '',
    "If you didn't request this, you can safely ignore this email."
  ].join('\n')
  const html = `
    <p>Hi ${payload.name},</p>
    <p>We received a request to reset your Nest password.</p>
    <p><a href="${payload.resetUrl}">Reset your password</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `
  await sendMail({ to: payload.to, subject, text, html })
}

export async function sendWelcomeEmail(payload: WelcomeMailPayload) {
  const subject = 'Welcome to Nest'
  const text = [
    `Hi ${payload.name},`,
    '',
    'Your Nest account is ready.',
    `Open the app: ${getAppBaseUrl()}`
  ].join('\n')
  const html = `
    <p>Hi ${payload.name},</p>
    <p>Your Nest account is ready.</p>
    <p><a href="${getAppBaseUrl()}">Open Nest</a></p>
  `
  await sendMail({ to: payload.to, subject, text, html })
}

export async function sendInviteEmail(payload: InviteMailPayload) {
  const params = new URLSearchParams({
    invite: payload.inviteCode,
    email: payload.to
  })
  const inviteUrl = `${getAppBaseUrl()}/?${params.toString()}`
  const subject = `You're invited to ${payload.householdName} on Nest`
  const text = [
    `Hi,`,
    '',
    `${payload.inviterName} invited you to join ${payload.householdName}.`,
    `Invite code: ${payload.inviteCode}`,
    `Join here: ${inviteUrl}`
  ].join('\n')
  const html = `
    <p>Hi,</p>
    <p>${payload.inviterName} invited you to join ${payload.householdName}.</p>
    <p><strong>Invite code:</strong> ${payload.inviteCode}</p>
    <p><a href="${inviteUrl}">Join the household</a></p>
  `
  await sendMail({ to: payload.to, subject, text, html })
}

export async function sendLoanCreatedEmail(payload: LoanMailPayload) {
  const subject = `New loan activity in ${payload.householdName}`
  const text = [
    `New loan activity in ${payload.householdName}:`,
    payload.summary,
    `Review: ${payload.linkUrl}`
  ].join('\n')
  const html = `
    <p>New loan activity in ${payload.householdName}:</p>
    <p>${payload.summary}</p>
    <p><a href="${payload.linkUrl}">Review the loan</a></p>
  `
  await sendMail({ to: payload.to, subject, text, html })
}

export async function sendLoanPaidEmail(payload: LoanMailPayload) {
  const subject = `Loan marked paid in ${payload.householdName}`
  const text = [
    `A loan was marked paid in ${payload.householdName}:`,
    payload.summary,
    `Review: ${payload.linkUrl}`
  ].join('\n')
  const html = `
    <p>A loan was marked paid in ${payload.householdName}:</p>
    <p>${payload.summary}</p>
    <p><a href="${payload.linkUrl}">Review the loan</a></p>
  `
  await sendMail({ to: payload.to, subject, text, html })
}
