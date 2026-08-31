import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

const TRACKED_EVENTS = [
  'whatsapp_enquiry',
  'sms_landing',
  'blog_article_cta_click',
  'blog_share',
  'page_view',
]

export function parseArgs(argv) {
  const args = {
    dryRun: false,
    month: null,
    send: true,
  }

  for (const arg of argv) {
    if (arg === '--dry-run') {
      args.dryRun = true
      args.send = false
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    } else if (arg.startsWith('--month=')) {
      args.month = arg.slice('--month='.length)
    } else if (arg === '--no-send') {
      args.send = false
    }
  }

  return args
}

export function printHelp() {
  console.log(`
TCTE monthly GA4 report

Usage:
  npm run report:monthly
  npm run report:monthly -- --dry-run
  npm run report:monthly -- --month=2026-08
  npm run report:monthly -- --no-send

Options:
  --dry-run     Generate the HTML report only; do not send email
  --no-send     Same as --dry-run
  --month=YYYY-MM  Report for a specific calendar month (default: previous month)
  --help        Show this message

Required environment variables (see .env.example):
  GA4_PROPERTY_ID
  GOOGLE_APPLICATION_CREDENTIALS
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
  REPORT_TO
`)
}

export function loadConfig() {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim()
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  const reportTo = process.env.REPORT_TO?.trim()
  const reportCc = process.env.REPORT_CC?.trim() || ''
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpPort = Number(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser
  const clientName = process.env.REPORT_CLIENT_NAME?.trim() || 'The Ceylon Tea Experience'
  const siteUrl = process.env.REPORT_SITE_URL?.trim() || 'https://www.theceylonteaexperience.com'
  const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID?.trim() || 'G-B23WLR63LD'

  const missing = []
  if (!propertyId) missing.push('GA4_PROPERTY_ID')
  if (!credentialsPath) missing.push('GOOGLE_APPLICATION_CREDENTIALS')
  if (!reportTo) missing.push('REPORT_TO')

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\nCopy .env.example to .env and fill in the values.`,
    )
  }

  const resolvedCredentials = resolve(credentialsPath)
  if (!existsSync(resolvedCredentials)) {
    throw new Error(`Service account key not found at: ${resolvedCredentials}`)
  }

  return {
    propertyId,
    credentialsPath: resolvedCredentials,
    reportTo,
    reportCc: reportCc
      ? reportCc.split(',').map((email) => email.trim()).filter(Boolean)
      : [],
    smtp: {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom,
    },
    clientName,
    siteUrl,
    ga4MeasurementId,
    trackedEvents: TRACKED_EVENTS,
  }
}

export function resolveReportMonth(monthArg) {
  const now = new Date()

  if (monthArg) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthArg)
    if (!match) {
      throw new Error(`Invalid --month value "${monthArg}". Use YYYY-MM, e.g. 2026-08.`)
    }
    const year = Number(match[1])
    const monthIndex = Number(match[2]) - 1
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error(`Invalid month in --month=${monthArg}`)
    }
    return monthRange(year, monthIndex)
  }

  const year = now.getFullYear()
  const monthIndex = now.getMonth() - 1
  if (monthIndex < 0) {
    return monthRange(year - 1, 11)
  }
  return monthRange(year, monthIndex)
}

function monthRange(year, monthIndex) {
  const start = new Date(Date.UTC(year, monthIndex, 1))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0))
  const previousStart = new Date(Date.UTC(year, monthIndex - 1, 1))
  const previousEnd = new Date(Date.UTC(year, monthIndex, 0))

  const label = start.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return {
    label,
    slug: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    startDate: formatGaDate(start),
    endDate: formatGaDate(end),
    previousStartDate: formatGaDate(previousStart),
    previousEndDate: formatGaDate(previousEnd),
  }
}

function formatGaDate(date) {
  return date.toISOString().slice(0, 10)
}

export function assertEmailConfig(config, { send }) {
  if (!send) return

  const missing = []
  if (!config.smtp.host) missing.push('SMTP_HOST')
  if (!config.smtp.user) missing.push('SMTP_USER')
  if (!config.smtp.pass) missing.push('SMTP_PASS')

  if (missing.length) {
    throw new Error(
      `Email sending requires: ${missing.join(', ')}\nUse --dry-run to generate the report without sending.`,
    )
  }
}
