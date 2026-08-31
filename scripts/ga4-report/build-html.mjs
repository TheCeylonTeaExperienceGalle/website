import { percentChange } from './fetch-ga4.mjs'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function formatDuration(seconds) {
  if (!seconds) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return mins ? `${mins}m ${secs}s` : `${secs}s`
}

function changeBadge(current, previous) {
  const change = percentChange(current, previous)
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const prefix = change > 0 ? '+' : ''
  return {
    direction,
    label: `${prefix}${change.toFixed(1)}% vs previous month`,
  }
}

function renderTable(headers, rows) {
  if (!rows.length) {
    return '<p class="empty">No data for this period.</p>'
  }

  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')

  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function renderMetricCards(overview) {
  const cards = [
    ['Sessions', overview.current.sessions, overview.previous.sessions],
    ['Users', overview.current.totalUsers, overview.previous.totalUsers],
    ['New users', overview.current.newUsers, overview.previous.newUsers],
    ['Engaged sessions', overview.current.engagedSessions, overview.previous.engagedSessions],
    ['Page views', overview.current.screenPageViews, overview.previous.screenPageViews],
  ]

  return cards
    .map(([label, current, previous]) => {
      const badge = changeBadge(current, previous)
      return `
        <div class="card ${badge.direction}">
          <p class="card-label">${escapeHtml(label)}</p>
          <p class="card-value">${formatNumber(current)}</p>
          <p class="card-change">${escapeHtml(badge.label)}</p>
        </div>
      `
    })
    .join('')
}

export function buildHtmlReport({ config, period, data, generatedAt }) {
  const { overview, channels, sourceMedium, topPages, events, smsSourceMedium } = data
  const whatsappEnquiries = events.find((item) => item.eventName === 'whatsapp_enquiry')?.eventCount ?? 0
  const smsLandings = events.find((item) => item.eventName === 'sms_landing')?.eventCount ?? 0
  const conversionRate = smsLandings ? (whatsappEnquiries / smsLandings) * 100 : 0

  const channelRows = channels.map((row) => [
    escapeHtml(row.label),
    formatNumber(row.sessions),
    formatNumber(row.totalUsers),
    formatNumber(row.engagedSessions),
  ])

  const sourceRows = sourceMedium.map((row) => [
    escapeHtml(row.label),
    formatNumber(row.sessions),
    formatNumber(row.totalUsers),
  ])

  const pageRows = topPages.map((row) => [
    escapeHtml(row.label),
    formatNumber(row.screenPageViews),
    formatNumber(row.sessions),
    formatDuration(row.averageSessionDuration),
  ])

  const eventRows = events.map((row) => [
    escapeHtml(row.eventName),
    formatNumber(row.eventCount),
  ])

  const smsRows = smsSourceMedium.map((row) => [
    escapeHtml(row.campaign),
    formatNumber(row.sessions),
    formatNumber(row.totalUsers),
    formatNumber(row.eventCount),
  ])

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.clientName)} — GA4 Report ${escapeHtml(period.label)}</title>
  <style>
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: #1A3D1A;
      background: #F9F6F0;
      line-height: 1.5;
    }
    .wrap {
      max-width: 920px;
      margin: 0 auto;
      padding: 32px 24px 48px;
    }
    .hero {
      background: linear-gradient(135deg, #1A3D1A, #2D6A2D);
      color: #fff;
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 24px;
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }
    .hero p {
      margin: 0;
      color: rgba(255,255,255,0.85);
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin-top: 16px;
      font-size: 14px;
    }
    .section {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .section h2 {
      margin: 0 0 8px;
      font-size: 20px;
      color: #2D6A2D;
    }
    .section p.lead {
      margin: 0 0 18px;
      color: #4b5563;
      font-size: 14px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 14px;
    }
    .card {
      background: #F9F6F0;
      border-radius: 12px;
      padding: 16px;
      border-top: 4px solid #B8960C;
    }
    .card.up { border-top-color: #2D6A2D; }
    .card.down { border-top-color: #b45309; }
    .card-label {
      margin: 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
    }
    .card-value {
      margin: 8px 0 4px;
      font-size: 28px;
      font-weight: 700;
      color: #1A3D1A;
    }
    .card-change {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 10px 8px;
      border-bottom: 1px solid #ececec;
      text-align: left;
    }
    th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
    }
    .highlight {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }
    .highlight .box {
      background: #1A3D1A;
      color: #fff;
      border-radius: 12px;
      padding: 18px;
    }
    .highlight .box strong {
      display: block;
      font-size: 28px;
      margin-top: 6px;
      color: #B8960C;
    }
    .empty {
      color: #6b7280;
      font-style: italic;
    }
    .footer {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>${escapeHtml(config.clientName)}</h1>
      <p>Monthly website analytics report — ${escapeHtml(period.label)}</p>
      <div class="meta">
        <span>Website: ${escapeHtml(config.siteUrl)}</span>
        <span>GA4 property: ${escapeHtml(config.ga4MeasurementId)}</span>
        <span>Generated: ${escapeHtml(generatedAt)}</span>
      </div>
    </section>

    <section class="section">
      <h2>Overview</h2>
      <p class="lead">Core traffic metrics compared with the previous month.</p>
      <div class="cards">${renderMetricCards(overview)}</div>
      <p class="lead" style="margin-top:18px;">
        Engagement rate: <strong>${formatPercent(overview.current.engagementRate)}</strong>
        · Average session duration: <strong>${formatDuration(overview.current.averageSessionDuration)}</strong>
      </p>
    </section>

    <section class="section">
      <h2>Booking &amp; campaign activity</h2>
      <p class="lead">Custom events tracked on the TCTE website.</p>
      <div class="highlight">
        <div class="box">
          WhatsApp enquiries
          <strong>${formatNumber(whatsappEnquiries)}</strong>
        </div>
        <div class="box">
          SMS landing visits
          <strong>${formatNumber(smsLandings)}</strong>
        </div>
        <div class="box">
          SMS → WhatsApp rate
          <strong>${smsLandings ? `${conversionRate.toFixed(1)}%` : 'N/A'}</strong>
        </div>
      </div>
      ${renderTable(['Event', 'Count'], eventRows)}
    </section>

    <section class="section">
      <h2>Traffic channels</h2>
      <p class="lead">How visitors found the website.</p>
      ${renderTable(['Channel', 'Sessions', 'Users', 'Engaged sessions'], channelRows)}
    </section>

    <section class="section">
      <h2>Top sources</h2>
      <p class="lead">Source / medium combinations driving the most sessions.</p>
      ${renderTable(['Source / medium', 'Sessions', 'Users'], sourceRows)}
    </section>

    ${
      smsRows.length
        ? `<section class="section">
      <h2>SMS campaigns</h2>
      <p class="lead">Traffic where session source was <strong>sms</strong>.</p>
      ${renderTable(['Campaign', 'Sessions', 'Users', 'Events'], smsRows)}
    </section>`
        : ''
    }

    <section class="section">
      <h2>Top pages</h2>
      <p class="lead">Most viewed pages during the reporting period.</p>
      ${renderTable(['Page path', 'Views', 'Sessions', 'Avg. session duration'], pageRows)}
    </section>

    <section class="section">
      <h2>Notes</h2>
      <p class="lead">
        Main site sections use hash routes (for example <code>/#services</code>), so section-level
        navigation may appear under the homepage in page reports. Blog pages appear as full paths
        under <code>/blog</code>.
      </p>
    </section>

    <p class="footer">
      Prepared automatically from Google Analytics 4 · ${escapeHtml(config.clientName)}
    </p>
  </div>
</body>
</html>`
}

export function buildPlainTextSummary({ config, period, data }) {
  const { overview, events } = data
  const whatsappEnquiries = events.find((item) => item.eventName === 'whatsapp_enquiry')?.eventCount ?? 0
  const smsLandings = events.find((item) => item.eventName === 'sms_landing')?.eventCount ?? 0

  return [
    `${config.clientName} — Monthly Analytics Report`,
    period.label,
    '',
    `Sessions: ${formatNumber(overview.current.sessions)}`,
    `Users: ${formatNumber(overview.current.totalUsers)}`,
    `New users: ${formatNumber(overview.current.newUsers)}`,
    `WhatsApp enquiries: ${formatNumber(whatsappEnquiries)}`,
    `SMS landing visits: ${formatNumber(smsLandings)}`,
    '',
    `Website: ${config.siteUrl}`,
    'The full HTML report is attached.',
  ].join('\n')
}
