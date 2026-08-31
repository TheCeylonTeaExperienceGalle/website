import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertEmailConfig,
  loadConfig,
  parseArgs,
  printHelp,
  resolveReportMonth,
} from './config.mjs'
import { buildHtmlReport, buildPlainTextSummary } from './build-html.mjs'
import { createGa4Client, fetchMonthlyReport } from './fetch-ga4.mjs'
import { sendReportEmail } from './send-email.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')
const reportsDir = resolve(repoRoot, 'output/reports')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const config = loadConfig()
  assertEmailConfig(config, { send: args.send && !args.dryRun })
  const period = resolveReportMonth(args.month)

  console.log(`[TCTE] Fetching GA4 data for ${period.label}...`)
  const client = createGa4Client(config.credentialsPath)
  const data = await fetchMonthlyReport(
    client,
    config.propertyId,
    period,
    config.trackedEvents,
  )

  const generatedAt = new Date().toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo',
  })

  const html = buildHtmlReport({ config, period, data, generatedAt })
  const text = buildPlainTextSummary({ config, period, data })

  await mkdir(reportsDir, { recursive: true })
  const reportPath = resolve(reportsDir, `TCTE-GA4-Report-${period.slug}.html`)
  await writeFile(reportPath, html, 'utf8')
  console.log(`[TCTE] Report saved to ${reportPath}`)

  if (args.dryRun || !args.send) {
    console.log('[TCTE] Dry run complete. Email was not sent.')
    return
  }

  const subject = await sendReportEmail({
    config,
    period,
    html,
    text,
    attachmentPath: reportPath,
  })

  console.log(`[TCTE] Report emailed to ${config.reportTo}`)
  console.log(`[TCTE] Subject: ${subject}`)
}

main().catch((error) => {
  console.error('[TCTE] Report failed:', error.message)
  process.exitCode = 1
})
