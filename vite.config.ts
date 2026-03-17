import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

type ServiceStatus = 'healthy' | 'warning' | 'error' | 'unknown'
type DataMode = 'live' | 'placeholder'

type DashboardPayload = {
  generatedAt: string
  lastRefresh: string
  serviceCards: Array<{
    title: string
    status: ServiceStatus
    detail: string
    summary: string
    mode?: DataMode
  }>
  budgetRuns: Array<{
    timestamp: string
    result: 'success' | 'partial' | 'failed'
    summary: string
    meta: string
    mode?: DataMode
  }>
  spendingMetrics: Array<{ label: string; value: string; tone?: ServiceStatus }>
  spendingCategories: Array<{ label: string; value: string; width: string }>
  funLibsMetrics: Array<{ label: string; value: string; tone?: ServiceStatus }>
  calendarEvents: Array<{ time: string; title: string; meta: string }>
  weather: {
    temperature: string
    condition: string
    range: string
    detail: string
    mode?: DataMode
  }
  vpsMetrics: Array<{ label: string; value: string; tone?: ServiceStatus }>
}

const budgetRunsRoot = '/opt/BudgetTools/runs'
const budgetToolsEnvPath = '/opt/BudgetTools/.env'

type WeatherProvider = 'open-meteo' | 'placeholder'


function readBudgetToolsEnv() {
  if (!fs.existsSync(budgetToolsEnvPath)) {
    return {}
  }

  const content = fs.readFileSync(budgetToolsEnvPath, 'utf8')
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

function getDashboardEnv() {
  const budgetEnv = readBudgetToolsEnv()
  return {
    gogAccount: process.env.GOG_ACCOUNT || budgetEnv.GOG_ACCOUNT || 'bjellanda@gmail.com',
    gogKeyringPassword: process.env.GOG_KEYRING_PASSWORD || budgetEnv.GOG_KEYRING_PASSWORD || '',
    weatherProvider: (process.env.WEATHER_PROVIDER || budgetEnv.WEATHER_PROVIDER || 'open-meteo') as WeatherProvider,
  }
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

async function getWeather(provider: WeatherProvider): Promise<DashboardPayload['weather']> {
  if (provider === 'placeholder') {
    return {
      temperature: '—',
      condition: 'Placeholder weather provider',
      range: 'No live provider selected',
      detail: 'Switch WEATHER_PROVIDER to open-meteo when ready',
      mode: 'placeholder',
    }
  }

  const latitude = 60.3913
  const longitude = 5.3221
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max')
  url.searchParams.set('timezone', 'UTC')
  url.searchParams.set('forecast_days', '1')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Open-Meteo returned ${response.status}`)
  }

  const payload = (await response.json()) as {
    current?: {
      temperature_2m?: number
      apparent_temperature?: number
      weather_code?: number
      wind_speed_10m?: number
    }
    daily?: {
      temperature_2m_max?: number[]
      temperature_2m_min?: number[]
      precipitation_probability_max?: number[]
    }
  }

  const weatherCodeMap: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy rain showers',
    95: 'Thunderstorm',
  }

  const current = payload.current ?? {}
  const daily = payload.daily ?? {}
  const condition = weatherCodeMap[current.weather_code ?? -1] ?? 'Unknown conditions'
  const high = daily.temperature_2m_max?.[0]
  const low = daily.temperature_2m_min?.[0]
  const precipitation = daily.precipitation_probability_max?.[0]

  return {
    temperature: current.temperature_2m != null ? `${Math.round(current.temperature_2m)}°C` : '—',
    condition: `${condition} in Bergen`,
    range:
      high != null && low != null
        ? `High ${Math.round(high)}° · Low ${Math.round(low)}°`
        : 'Daily range unavailable',
    detail: [
      current.apparent_temperature != null
        ? `Feels like ${Math.round(current.apparent_temperature)}°`
        : null,
      current.wind_speed_10m != null ? `Wind ${Math.round(current.wind_speed_10m)} km/h` : null,
      precipitation != null ? `Precipitation ${formatPercent(precipitation)}` : null,
      'Provider: Open-Meteo',
    ]
      .filter(Boolean)
      .join(' · '),
    mode: 'live',
  }
}

function formatUtc(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(',', ' ·') + ' UTC'
}

function statusFromHttp(statusCode: number): ServiceStatus {
  if (statusCode >= 200 && statusCode < 400) return 'healthy'
  if (statusCode >= 400 && statusCode < 500) return 'warning'
  return 'error'
}

async function checkUrl(label: string, url: string) {
  try {
    const started = Date.now()
    const response = await fetch(url, { redirect: 'follow' })
    const duration = Date.now() - started
    return {
      title: label,
      status: statusFromHttp(response.status),
      detail: `${response.status} from ${new URL(url).host}`,
      summary: `${duration} ms response`,
      mode: 'live' as const,
    }
  } catch (error) {
    return {
      title: label,
      status: 'error' as const,
      detail: `Health check failed for ${new URL(url).host}`,
      summary: error instanceof Error ? error.message : 'Unknown error',
      mode: 'live' as const,
    }
  }
}

function readBudgetRuns(): DashboardPayload['budgetRuns'] {
  if (!fs.existsSync(budgetRunsRoot)) {
    return [{
      timestamp: 'Unavailable',
      result: 'failed',
      summary: 'BudgetTools run directory not found.',
      meta: budgetRunsRoot,
      mode: 'placeholder',
    }]
  }

  const runs = fs.readdirSync(budgetRunsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .slice(-3)
    .reverse()

  return runs.map((runId) => {
    const summaryPath = path.join(budgetRunsRoot, runId, 'summary.json')
    const failurePath = path.join(budgetRunsRoot, runId, 'failure-summary.txt')
    const payload = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
      startedAt: string
      finishedAt?: string
      durationSeconds?: number
      status: string
      failedStage?: string
    }

    const status = payload.status === 'success' ? 'success' : payload.status === 'partial' ? 'partial' : 'failed'
    const failureSummary = fs.existsSync(failurePath)
      ? fs.readFileSync(failurePath, 'utf8').trim().split('\n')[0]
      : ''

    return {
      timestamp: formatUtc(payload.startedAt),
      result: status,
      summary:
        status === 'success'
          ? 'Completed successfully.'
          : failureSummary || `Run ended with status: ${payload.status}`,
      meta: `Duration ${payload.durationSeconds ?? 0}s${payload.failedStage ? ` · failed stage: ${payload.failedStage}` : ''}`,
      mode: 'live' as const,
    }
  })
}

function getVpsMetrics(): DashboardPayload['vpsMetrics'] {
  const cpus = os.loadavg()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100)
  const uptimeHours = Math.floor(os.uptime() / 3600)
  const uptimeDays = Math.floor(uptimeHours / 24)
  const remainingHours = uptimeHours % 24

  let diskValue = 'Unavailable'
  try {
    const output = execFileSync('df', ['-h', '/'], { encoding: 'utf8' }).trim().split('\n')[1]
    diskValue = output.split(/\s+/)[4] ?? 'Unavailable'
  } catch {
    diskValue = 'Unavailable'
  }

  return [
    { label: 'CPU load', value: cpus[0].toFixed(2) },
    { label: 'RAM', value: `${usedMemPct}%` },
    { label: 'Disk', value: diskValue },
    { label: 'Uptime', value: `${uptimeDays}d ${remainingHours}h` },
  ]
}

function getCalendarEvents(): DashboardPayload['calendarEvents'] {
  const dashboardEnv = getDashboardEnv()
  const account = dashboardEnv.gogAccount
  const keyringPassword = dashboardEnv.gogKeyringPassword

  if (!keyringPassword) {
    return [{
      time: '—',
      title: 'Calendar placeholder',
      meta: 'GOG_KEYRING_PASSWORD not available in this session',
    }]
  }

  try {
    const now = new Date()
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString()
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)).toISOString()

    const command = `eval "$([ -x /home/linuxbrew/.linuxbrew/bin/brew ] && /home/linuxbrew/.linuxbrew/bin/brew shellenv)"; gog calendar events primary --from ${JSON.stringify(from)} --to ${JSON.stringify(to)} --json --account ${JSON.stringify(account)}`
    const raw = execFileSync('bash', ['-lc', command], {
      encoding: 'utf8',
      env: { ...process.env, GOG_KEYRING_PASSWORD: keyringPassword },
    })

    const parsed = JSON.parse(raw) as Array<{ summary?: string; start?: { dateTime?: string; date?: string }; location?: string }>
    if (!parsed.length) {
      return [{ time: '—', title: 'No calendar events today', meta: 'Live calendar data' }]
    }

    return parsed.slice(0, 5).map((event) => {
      const rawStart = event.start?.dateTime || event.start?.date || ''
      const date = rawStart ? new Date(rawStart) : null
      const isAllDay = Boolean(event.start?.date && !event.start?.dateTime)
      return {
        time: isAllDay || !date ? 'All day' : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(date),
        title: event.summary || 'Untitled event',
        meta: event.location || 'Google Calendar',
      }
    })
  } catch (error) {
    return [{
      time: '—',
      title: 'Calendar placeholder',
      meta: error instanceof Error ? error.message.split('\n')[0] : 'GOG calendar error',
    }]
  }
}

async function buildDashboardPayload(): Promise<DashboardPayload> {
  const dashboardEnv = getDashboardEnv()
  const budgetRuns = readBudgetRuns()
  const [budgetHealth, actualBudget, mainSite, devSite, weather] = await Promise.all([
    Promise.resolve({
      title: 'BudgetTools',
      status: (budgetRuns[0]?.result === 'success'
        ? 'healthy'
        : budgetRuns[0]?.result === 'partial'
          ? 'warning'
          : 'error') as ServiceStatus,
      detail: budgetRuns[0]?.mode === 'live' ? 'Derived from latest run summary' : 'No live run summary available',
      summary: budgetRuns[0]?.summary ?? 'No data',
      mode: budgetRuns[0]?.mode ?? 'placeholder',
    }),
    checkUrl('Actual Budget', 'https://budget.albretsen.no'),
    checkUrl('albretsen.no', 'https://albretsen.no'),
    checkUrl('dev.albretsen.no', 'https://dev.albretsen.no'),
    getWeather(dashboardEnv.weatherProvider),
  ])

  return {
    generatedAt: `Updated ${formatUtc(new Date().toISOString())}`,
    lastRefresh: 'Auto-refresh every 2 min in dev',
    serviceCards: [
      budgetHealth,
      actualBudget,
      mainSite,
      {
        title: 'dev.albretsen.no',
        status: devSite.status,
        detail: devSite.detail,
        summary: devSite.summary,
        mode: devSite.mode,
      },
    ],
    budgetRuns,
    spendingMetrics: [
      { label: 'This month', value: 'Placeholder' },
      { label: 'Largest category', value: 'Placeholder' },
      { label: 'Budget drift', value: 'Placeholder' },
    ],
    spendingCategories: [{ label: 'Spending data', value: 'Placeholder until source is wired', width: '35%' }],
    funLibsMetrics: [
      { label: 'Status', value: 'Waiting by request' },
      { label: 'Source', value: 'Placeholder' },
    ],
    calendarEvents: getCalendarEvents(),
    weather,
    vpsMetrics: getVpsMetrics(),
  }
}

function dashboardApiPlugin() {
  return {
    name: 'dashboard-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/dashboard', async (_req, res) => {
        try {
          const payload = await buildDashboardPayload()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown dashboard error' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), dashboardApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: ['dev.albretsen.no'],
  },
})
