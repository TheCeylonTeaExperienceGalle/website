import { BetaAnalyticsDataClient } from '@google-analytics/data'

function metricValue(row, index = 0) {
  const value = row?.metricValues?.[index]?.value
  return value ? Number(value) : 0
}

function dimensionValue(row, index = 0) {
  return row?.dimensionValues?.[index]?.value ?? '(not set)'
}

export function createGa4Client(credentialsPath) {
  return new BetaAnalyticsDataClient({ keyFilename: credentialsPath })
}

async function runReport(client, propertyId, request) {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    ...request,
  })
  return response
}

export async function fetchMonthlyReport(client, propertyId, period, trackedEvents) {
  const dateRange = [{ startDate: period.startDate, endDate: period.endDate }]
  const previousDateRange = [
    { startDate: period.previousStartDate, endDate: period.previousEndDate },
  ]

  const [
    overviewCurrent,
    overviewPrevious,
    channels,
    sourceMedium,
    topPages,
    events,
    smsSourceMedium,
  ] = await Promise.all([
    fetchOverview(client, propertyId, dateRange),
    fetchOverview(client, propertyId, previousDateRange),
    fetchDimensionTable(client, propertyId, dateRange, 'sessionDefaultChannelGroup', [
      'sessions',
      'totalUsers',
      'engagedSessions',
    ], 12),
    fetchDimensionTable(client, propertyId, dateRange, 'sessionSourceMedium', [
      'sessions',
      'totalUsers',
    ], 15),
    fetchDimensionTable(client, propertyId, dateRange, 'pagePath', [
      'screenPageViews',
      'sessions',
      'averageSessionDuration',
    ], 15),
    fetchEventCounts(client, propertyId, dateRange, trackedEvents),
    fetchSmsTraffic(client, propertyId, dateRange),
  ])

  return {
    overview: {
      current: overviewCurrent,
      previous: overviewPrevious,
    },
    channels,
    sourceMedium,
    topPages,
    events,
    smsSourceMedium,
  }
}

async function fetchOverview(client, propertyId, dateRanges) {
  const response = await runReport(client, propertyId, {
    dateRanges,
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'engagedSessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViews' },
    ],
  })

  const row = response.rows?.[0]
  return {
    sessions: metricValue(row, 0),
    totalUsers: metricValue(row, 1),
    newUsers: metricValue(row, 2),
    engagedSessions: metricValue(row, 3),
    engagementRate: metricValue(row, 4),
    averageSessionDuration: metricValue(row, 5),
    screenPageViews: metricValue(row, 6),
  }
}

async function fetchDimensionTable(
  client,
  propertyId,
  dateRanges,
  dimensionName,
  metricNames,
  limit,
) {
  const response = await runReport(client, propertyId, {
    dateRanges,
    dimensions: [{ name: dimensionName }],
    metrics: metricNames.map((name) => ({ name })),
    orderBys: [{ metric: { metricName: metricNames[0] }, desc: true }],
    limit: String(limit),
  })

  return (response.rows ?? []).map((row) => {
    const item = { label: dimensionValue(row, 0) }
    metricNames.forEach((metricName, index) => {
      item[metricName] = metricValue(row, index)
    })
    return item
  })
}

async function fetchEventCounts(client, propertyId, dateRanges, trackedEvents) {
  const response = await runReport(client, propertyId, {
    dateRanges,
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: trackedEvents },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: '20',
  })

  const counts = Object.fromEntries(trackedEvents.map((name) => [name, 0]))
  for (const row of response.rows ?? []) {
    counts[dimensionValue(row, 0)] = metricValue(row, 0)
  }

  return trackedEvents.map((name) => ({
    eventName: name,
    eventCount: counts[name] ?? 0,
  }))
}

async function fetchSmsTraffic(client, propertyId, dateRanges) {
  const response = await runReport(client, propertyId, {
    dateRanges,
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionCampaignName' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'eventCount' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'sessionSource',
        stringFilter: { matchType: 'EXACT', value: 'sms' },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: '10',
  })

  return (response.rows ?? []).map((row) => ({
    campaign: dimensionValue(row, 1),
    sessions: metricValue(row, 0),
    totalUsers: metricValue(row, 1),
    eventCount: metricValue(row, 2),
  }))
}

export function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0
  return ((current - previous) / previous) * 100
}
