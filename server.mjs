import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist')
const budgetRunsRoot = '/opt/BudgetTools/runs'
const budgetOriginalDownloadsRoot = '/opt/BudgetTools/original-downloads'
const budgetToolsEnvPath = '/opt/BudgetTools/.env'
const projectEnvPath = '/opt/albretsen.no/.env'
const actualBudgetFileId = '661e923a-109b-4412-ae67-4f26bafd055b'
const actualBaseUrl = 'http://127.0.0.1:5006'
const dashboardCookieName = 'albretsen_dashboard_session'

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=')
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      }),
  )
}

function getDashboardEnv() {
  const budgetEnv = readEnvFile(budgetToolsEnvPath)
  const projectEnv = readEnvFile(projectEnvPath)
  return {
    gogAccount: process.env.GOG_ACCOUNT || budgetEnv.GOG_ACCOUNT || projectEnv.GOG_ACCOUNT || 'bjellanda@gmail.com',
    gogKeyringPassword: process.env.GOG_KEYRING_PASSWORD || budgetEnv.GOG_KEYRING_PASSWORD || projectEnv.GOG_KEYRING_PASSWORD || '',
    weatherProvider: process.env.WEATHER_PROVIDER || projectEnv.WEATHER_PROVIDER || budgetEnv.WEATHER_PROVIDER || 'open-meteo',
    dashboardPassword: process.env.DASHBOARD_PASSWORD || projectEnv.DASHBOARD_PASSWORD || budgetEnv.DASHBOARD_PASSWORD || '',
    actualPassword: process.env.BUDGET_PASSWORD || budgetEnv.BUDGET_PASSWORD || projectEnv.BUDGET_PASSWORD || '',
  }
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {}
  return Object.fromEntries(cookieHeader.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const idx = part.indexOf('=')
    return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))]
  }))
}

function createDashboardSessionValue(password) {
  return Buffer.from(password).toString('base64url')
}

function isDashboardAuthenticated(cookieHeader) {
  const env = getDashboardEnv()
  if (!env.dashboardPassword) return false
  const cookies = parseCookies(cookieHeader)
  return cookies[dashboardCookieName] === createDashboardSessionValue(env.dashboardPassword)
}

function sendJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', ...headers })
  res.end(JSON.stringify(payload))
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function requireDashboardAuth(req, res) {
  const env = getDashboardEnv()
  if (!env.dashboardPassword) {
    sendJson(res, 503, { error: 'Dashboard password is not configured' })
    return false
  }
  if (!isDashboardAuthenticated(req.headers.cookie)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return false
  }
  return true
}

function formatNokFromMilliunits(value) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency', currency: 'NOK', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value / 100)
}

async function getActualToken(password) {
  const response = await fetch(`${actualBaseUrl}/account/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
  })
  if (!response.ok) throw new Error(`Actual login failed with ${response.status}`)
  const payload = await response.json()
  if (!payload.data?.token) throw new Error('Actual login did not return a token')
  return payload.data.token
}

async function downloadActualBudgetFile(token) {
  const response = await fetch(`${actualBaseUrl}/sync/download-user-file`, {
    headers: { 'X-ACTUAL-TOKEN': token, 'X-ACTUAL-FILE-ID': actualBudgetFileId },
  })
  if (!response.ok) throw new Error(`Actual download failed with ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function getSpendingSnapshot() {
  const env = getDashboardEnv()
  if (!env.actualPassword) {
    return { metrics: [
      { label: 'This month', value: 'Unavailable' },
      { label: 'Largest category', value: 'Unavailable' },
      { label: 'Transactions', value: 'Unavailable' },
    ], categories: [{ label: 'Spending data', value: 'Actual password missing', width: '35%' }] }
  }
  const tempZipPath = path.join(os.tmpdir(), `albretsen-dashboard-${process.pid}-actual.zip`)
  const tempDbPath = path.join(os.tmpdir(), `albretsen-dashboard-${process.pid}-actual.sqlite`)
  try {
    const token = await getActualToken(env.actualPassword)
    fs.writeFileSync(tempZipPath, await downloadActualBudgetFile(token))
    const script = `
import json, sqlite3, zipfile
from datetime import datetime, timezone
zip_path = ${JSON.stringify(tempZipPath)}
db_path = ${JSON.stringify(tempDbPath)}
with zipfile.ZipFile(zip_path) as zf:
    with open(db_path, 'wb') as fh:
        fh.write(zf.read('db.sqlite'))
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
now = datetime.now(timezone.utc)
month_start = int(f"{now.year}{now.month:02d}01")
if now.month == 12:
    next_month_start = int(f"{now.year + 1}0101")
else:
    next_month_start = int(f"{now.year}{now.month + 1:02d}01")
top_categories = cur.execute("""
    select c.name as label,
           sum(case when t.amount < 0 then -t.amount else 0 end) as spent,
           count(*) as transactionCount
    from transactions t
    left join categories c on c.id = t.category
    left join category_groups cg on cg.id = c.cat_group
    where t.tombstone = 0 and t.starting_balance_flag = 0 and ifnull(t.isChild, 0) = 0
      and t.date >= ? and t.date < ? and t.amount < 0 and c.name is not null
      and ifnull(cg.name, '') not in ('Income', 'Other')
    group by c.name order by spent desc limit 5
""", (month_start, next_month_start)).fetchall()
totals = cur.execute("""
    select coalesce(sum(case when t.amount < 0 then -t.amount else 0 end), 0) as spent,
           count(*) as transactionCount,
           sum(case when t.pending = 1 then 1 else 0 end) as pendingCount
    from transactions t
    left join categories c on c.id = t.category
    left join category_groups cg on cg.id = c.cat_group
    where t.tombstone = 0 and t.starting_balance_flag = 0 and ifnull(t.isChild, 0) = 0
      and t.date >= ? and t.date < ? and t.amount < 0 and c.name is not null
      and ifnull(cg.name, '') not in ('Income', 'Other')
""", (month_start, next_month_start)).fetchone()
print(json.dumps({'totalSpent': totals['spent'] or 0, 'transactionCount': totals['transactionCount'] or 0, 'pendingCount': totals['pendingCount'] or 0, 'topCategories': [dict(row) for row in top_categories]}))
`
    const parsed = JSON.parse(execFileSync('python3', ['-c', script], { encoding: 'utf8' }))
    const largestCategory = parsed.topCategories[0]
    return {
      metrics: [
        { label: 'This month', value: formatNokFromMilliunits(parsed.totalSpent) },
        { label: 'Largest category', value: largestCategory ? `${largestCategory.label} · ${formatNokFromMilliunits(largestCategory.spent)}` : 'No categorized spending' },
        { label: 'Transactions', value: `${parsed.transactionCount}${parsed.pendingCount > 0 ? ` · ${parsed.pendingCount} pending` : ''}` },
      ],
      categories: parsed.topCategories.map((category) => ({
        label: category.label,
        value: formatNokFromMilliunits(category.spent),
        width: parsed.totalSpent > 0 ? `${Math.max(12, Math.round((category.spent / parsed.totalSpent) * 100))}%` : '12%',
      })),
    }
  } catch (error) {
    return { metrics: [
      { label: 'This month', value: 'Unavailable' },
      { label: 'Largest category', value: 'Unavailable' },
      { label: 'Transactions', value: 'Unavailable' },
    ], categories: [{ label: 'Spending data', value: error instanceof Error ? error.message.split('\n')[0] : 'Spending snapshot failed', width: '35%' }] }
  } finally {
    fs.rmSync(tempZipPath, { force: true }); fs.rmSync(tempDbPath, { force: true })
  }
}

function formatPercent(value) { return `${Math.round(value)}%` }

async function getWeather(provider) {
  if (provider === 'placeholder') return { temperature: '—', condition: 'Placeholder weather provider', range: 'No live provider selected', detail: 'Switch WEATHER_PROVIDER to open-meteo when ready', mode: 'placeholder' }
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', '60.3913'); url.searchParams.set('longitude', '5.3221')
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max')
  url.searchParams.set('timezone', 'UTC'); url.searchParams.set('forecast_days', '1')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`)
  const payload = await response.json()
  const weatherCodeMap = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Dense drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Rain showers',82:'Heavy rain showers',95:'Thunderstorm'}
  const current = payload.current ?? {}
  const daily = payload.daily ?? {}
  const condition = weatherCodeMap[current.weather_code ?? -1] ?? 'Unknown conditions'
  const high = daily.temperature_2m_max?.[0], low = daily.temperature_2m_min?.[0], precipitation = daily.precipitation_probability_max?.[0]
  return {
    temperature: current.temperature_2m != null ? `${Math.round(current.temperature_2m)}°C` : '—',
    condition: `${condition} in Bergen`,
    range: high != null && low != null ? `High ${Math.round(high)}° · Low ${Math.round(low)}°` : 'Daily range unavailable',
    detail: [current.apparent_temperature != null ? `Feels like ${Math.round(current.apparent_temperature)}°` : null, current.wind_speed_10m != null ? `Wind ${Math.round(current.wind_speed_10m)} km/h` : null, precipitation != null ? `Precipitation ${formatPercent(precipitation)}` : null, 'Provider: Open-Meteo'].filter(Boolean).join(' · '),
    mode: 'live',
  }
}

function formatOsloTime(iso) {
  const date = new Date(iso)
  const formatted = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date).replace(',', ' ·')
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', timeZoneName: 'short' }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value ?? 'CET'
  return `${formatted} ${zone}`
}

function statusFromHttp(statusCode) { if (statusCode >= 200 && statusCode < 400) return 'healthy'; if (statusCode >= 400 && statusCode < 500) return 'warning'; return 'error' }
async function checkUrl(label, url) {
  try {
    const started = Date.now(); const response = await fetch(url, { redirect: 'follow' }); const duration = Date.now() - started
    return { title: label, status: statusFromHttp(response.status), detail: `${response.status} from ${new URL(url).host}`, summary: `${duration} ms response`, mode: 'live' }
  } catch (error) {
    return { title: label, status: 'error', detail: `Health check failed for ${new URL(url).host}`, summary: error instanceof Error ? error.message : 'Unknown error', mode: 'live' }
  }
}

function getBudgetRunState(payload) {
  const isDefinitelyRunning = payload.status === 'running' && (payload.exitCode == null || payload.exitCode === 999)
  if (payload.status === 'success') return { result: 'success', summary: 'Completed successfully.' }
  if (isDefinitelyRunning) return { result: 'partial', summary: 'BudgetTools daily flow is still in progress.' }
  if (payload.status === 'partial') return { result: 'partial', summary: `Run finished with warnings${payload.failedStage ? ` during ${payload.failedStage}` : ''}.` }
  return { result: 'failed', summary: payload.failedStage ? `BudgetTools daily flow failed during ${payload.failedStage}.` : 'BudgetTools daily flow failed.' }
}

function readBudgetRuns() {
  if (!fs.existsSync(budgetRunsRoot)) return [{ timestamp: 'Unavailable', result: 'failed', summary: 'BudgetTools run directory not found.', meta: budgetRunsRoot, mode: 'placeholder' }]
  const runs = fs.readdirSync(budgetRunsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(entry.name)).map((entry) => entry.name).sort().slice(-3).reverse()
  return runs.map((runId) => {
    const summaryPath = path.join(budgetRunsRoot, runId, 'summary.json')
    const failurePath = path.join(budgetRunsRoot, runId, 'failure-summary.txt')
    const payload = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
    const derived = getBudgetRunState(payload)
    const failureSummary = fs.existsSync(failurePath) ? fs.readFileSync(failurePath, 'utf8').trim().split('\n')[0] : ''
    const summary = derived.result === 'failed' && failureSummary && !failureSummary.startsWith('RUNNING:') ? failureSummary : derived.summary
    return { timestamp: formatOsloTime(payload.startedAt), result: derived.result, summary, meta: `Duration ${payload.durationSeconds ?? 0}s${payload.failedStage ? ` · failed stage: ${payload.failedStage}` : ''}${payload.exitCode != null ? ` · exit ${payload.exitCode}` : ''}`, mode: 'live' }
  })
}

function formatBudgetOriginalDownloadLabel(fileName) {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/)
  if (!match) return fileName
  return `${match[1]} ${match[2]}:${match[3]}:${match[4]} UTC`
}

function listBudgetOriginalDownloads() {
  if (!fs.existsSync(budgetOriginalDownloadsRoot)) {
    return [{ id: 'missing', account: 'Archive unavailable', timestamp: 'Unavailable', fileName: 'original-downloads', relativePath: '', sizeLabel: '—', mode: 'placeholder' }]
  }

  const files = []
  for (const accountEntry of fs.readdirSync(budgetOriginalDownloadsRoot, { withFileTypes: true })) {
    if (!accountEntry.isDirectory()) continue
    const accountDir = path.join(budgetOriginalDownloadsRoot, accountEntry.name)
    for (const fileEntry of fs.readdirSync(accountDir, { withFileTypes: true })) {
      if (!fileEntry.isFile()) continue
      const absolutePath = path.join(accountDir, fileEntry.name)
      const stats = fs.statSync(absolutePath)
      files.push({
        id: `${accountEntry.name}__${fileEntry.name}`.replace(/[^a-zA-Z0-9._-]/g, '_'),
        account: accountEntry.name.replace(/[_-]+/g, ' '),
        timestamp: formatBudgetOriginalDownloadLabel(fileEntry.name),
        fileName: fileEntry.name.split('__').slice(1).join('__') || fileEntry.name,
        relativePath: path.relative(budgetOriginalDownloadsRoot, absolutePath),
        absolutePath,
        sizeLabel: `${(stats.size / 1024).toFixed(stats.size >= 1024 ? 1 : 0)} KB`,
        mode: 'live',
        mtimeMs: stats.mtimeMs,
      })
    }
  }

  return files.sort((a, b) => b.mtimeMs - a.mtimeMs)
}

function getBudgetOriginalDownloadsSection(searchParams) {
  const query = (searchParams?.get('q') || '').trim()
  const requestedPage = Number.parseInt(searchParams?.get('page') || '1', 10)
  const requestedPageSize = Number.parseInt(searchParams?.get('pageSize') || '12', 10)
  const pageSize = Math.min(50, Math.max(1, Number.isFinite(requestedPageSize) ? requestedPageSize : 12))

  const allFiles = listBudgetOriginalDownloads()
  const filteredFiles = query
    ? allFiles.filter((file) => `${file.account} ${file.timestamp} ${file.fileName} ${file.relativePath}`.toLowerCase().includes(query.toLowerCase()))
    : allFiles

  const totalFiles = filteredFiles.length
  const totalPages = Math.max(1, Math.ceil(totalFiles / pageSize))
  const page = Math.min(totalPages, Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1))
  const files = filteredFiles
    .slice((page - 1) * pageSize, page * pageSize)
    .map(({ absolutePath, mtimeMs, ...file }) => file)

  return {
    mode: files.some((file) => file.mode === 'placeholder') ? 'placeholder' : 'live',
    detail: totalFiles && files[0]?.mode !== 'placeholder' ? 'Original downloaded CSV files, retained for 1 year' : 'No archived original CSV downloads yet',
    files,
    query,
    page,
    pageSize,
    totalFiles,
    totalPages,
  }
}

function getBudgetOriginalDownloadById(downloadId) {
  const files = listBudgetOriginalDownloads()
  return files.find((file) => file.id === downloadId) ?? null
}

function getContainerSummary() {
  try {
    const runtime = fs.existsSync('/usr/bin/podman') ? 'podman' : fs.existsSync('/usr/bin/docker') ? 'docker' : null
    if (!runtime) return { value: 'Unavailable', tone: 'unknown' }
    const output = execFileSync(runtime, ['ps', '--format', '{{.Names}}\t{{.Status}}'], { encoding: 'utf8', timeout: 3000 }).trim().split('\n').filter(Boolean)
    if (!output.length) return { value: '0 running', tone: 'warning' }
    const running = output.filter((line) => line.includes('\tUp ')).length
    const healthy = output.filter((line) => /\(healthy\)/i.test(line)).length
    const unhealthy = output.filter((line) => /\(unhealthy\)|\(health: starting\)/i.test(line)).length
    const withHealthChecks = healthy + unhealthy
    if (unhealthy > 0) return { value: `${running} running · ${healthy}/${withHealthChecks} healthchecks passing`, tone: 'warning' }
    if (withHealthChecks > 0) return { value: `${running} running · ${healthy}/${withHealthChecks} healthchecks passing`, tone: 'healthy' }
    return { value: `${running} running`, tone: 'healthy' }
  } catch { return { value: 'Unavailable', tone: 'unknown' } }
}

function getVpsMetrics() {
  const cpus = os.loadavg(), totalMem = os.totalmem(), freeMem = os.freemem(), usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100), uptimeHours = Math.floor(os.uptime() / 3600), uptimeDays = Math.floor(uptimeHours / 24), remainingHours = uptimeHours % 24, containers = getContainerSummary()
  let diskValue = 'Unavailable'
  try { diskValue = execFileSync('df', ['-h', '/'], { encoding: 'utf8' }).trim().split('\n')[1].split(/\s+/)[4] ?? 'Unavailable' } catch {}
  return [
    { label: 'CPU load', value: cpus[0].toFixed(2) },
    { label: 'RAM', value: `${usedMemPct}%`, tone: usedMemPct >= 90 ? 'warning' : 'healthy' },
    { label: 'Disk', value: diskValue, tone: diskValue === 'Unavailable' ? 'unknown' : Number.parseInt(diskValue, 10) >= 90 ? 'warning' : 'healthy' },
    { label: 'Uptime', value: `${uptimeDays}d ${remainingHours}h` },
    { label: 'Containers', value: containers.value, tone: containers.tone },
  ]
}

function getCalendarEvents() {
  const dashboardEnv = getDashboardEnv(); const account = dashboardEnv.gogAccount; const keyringPassword = dashboardEnv.gogKeyringPassword
  if (!keyringPassword) return { mode: 'placeholder', status: 'warning', detail: 'Calendar is blocked until GOG auth is available', events: [{ time: '—', title: 'Calendar unavailable', meta: 'Missing GOG keyring password in dashboard session' }] }
  try {
    const now = new Date()
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString()
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)).toISOString()
    const command = `eval "$([ -x /home/linuxbrew/.linuxbrew/bin/brew ] && /home/linuxbrew/.linuxbrew/bin/brew shellenv)"; gog calendar events primary --from ${JSON.stringify(from)} --to ${JSON.stringify(to)} --json --account ${JSON.stringify(account)}`
    const raw = execFileSync('bash', ['-lc', command], { encoding: 'utf8', env: { ...process.env, GOG_KEYRING_PASSWORD: keyringPassword } })
    const parsed = JSON.parse(raw)
    if (!parsed.length) return { mode: 'live', status: 'healthy', detail: 'Today from Google Calendar', events: [{ time: '—', title: 'No calendar events today', meta: 'Live calendar data' }] }
    return { mode: 'live', status: 'healthy', detail: 'Today from Google Calendar', events: parsed.slice(0, 5).map((event) => {
      const rawStart = event.start?.dateTime || event.start?.date || ''
      const date = rawStart ? new Date(rawStart) : null
      const isAllDay = Boolean(event.start?.date && !event.start?.dateTime)
      return { time: isAllDay || !date ? 'All day' : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Oslo' }).format(date), title: event.summary || 'Untitled event', meta: event.location || 'Google Calendar' }
    }) }
  } catch (error) {
    const errorText = error instanceof Error ? error.message : 'GOG calendar error'
    const isAuthError = errorText.includes('invalid_grant') || errorText.includes('expired or revoked')
    return { mode: 'placeholder', status: 'warning', detail: isAuthError ? 'Calendar needs Google re-authentication' : 'Calendar is temporarily unavailable', events: [{ time: '—', title: isAuthError ? 'Calendar blocked' : 'Calendar unavailable', meta: isAuthError ? 'GOG token expired or revoked for bjellanda@gmail.com' : 'Could not load today\'s events right now' }] }
  }
}

function getDashboardOverview() { return { generatedAt: `Updated ${formatOsloTime(new Date().toISOString())}`, lastRefresh: 'Auto-refresh every 2 min' } }
function getFunLibsSection() { return { mode: 'placeholder', detail: 'Explicitly kept as placeholder for now', metrics: [{ label: 'Status', value: 'Waiting by request' }, { label: 'Source', value: 'Placeholder' }] } }
function getBudgetRunsSection() { const runs = readBudgetRuns(); return { mode: runs.some((run) => run.mode === 'placeholder') ? 'placeholder' : 'live', runs } }
async function getServiceCardsSection() {
  const budgetRuns = readBudgetRuns()
  const [actualBudget, mainSite, devSite] = await Promise.all([
    checkUrl('Actual Budget', 'https://budget.albretsen.no'),
    checkUrl('albretsen.no', 'https://albretsen.no'),
    checkUrl('dev.albretsen.no', 'https://dev.albretsen.no'),
  ])
  return [{ title: 'BudgetTools', status: budgetRuns[0]?.result === 'success' ? 'healthy' : budgetRuns[0]?.result === 'partial' ? 'warning' : 'error', detail: budgetRuns[0]?.mode === 'live' ? 'Derived from latest run summary' : 'No live run summary available', summary: budgetRuns[0]?.summary ?? 'No data', mode: budgetRuns[0]?.mode ?? 'placeholder' }, actualBudget, mainSite, { title: 'dev.albretsen.no', status: devSite.status, detail: devSite.detail, summary: devSite.summary, mode: devSite.mode }]
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.woff': 'font/woff', '.woff2': 'font/woff2'
}

function sendFile(res, filePath, headers = {}) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) { res.writeHead(404); res.end('Not found'); return }
  const ext = path.extname(filePath).toLowerCase(); const type = mimeTypes[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, ...headers })
  fs.createReadStream(filePath).pipe(res)
}

async function handleApi(req, res, pathname, searchParams) {
  if (pathname === '/api/dashboard/session') return sendJson(res, 200, { authenticated: isDashboardAuthenticated(req.headers.cookie), configured: Boolean(getDashboardEnv().dashboardPassword) })
  if (pathname === '/api/dashboard/login') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    const env = getDashboardEnv(); if (!env.dashboardPassword) return sendJson(res, 503, { error: 'Dashboard password is not configured' })
    try {
      const payload = JSON.parse(await readRequestBody(req) || '{}')
      if (payload.password !== env.dashboardPassword) return sendJson(res, 401, { error: 'Wrong password' })
      return sendJson(res, 200, { authenticated: true, configured: true }, { 'Set-Cookie': `${dashboardCookieName}=${createDashboardSessionValue(env.dashboardPassword)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` })
    } catch { return sendJson(res, 400, { error: 'Invalid login payload' }) }
  }
  if (pathname === '/api/dashboard/logout') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    return sendJson(res, 200, { authenticated: false, configured: Boolean(getDashboardEnv().dashboardPassword) }, { 'Set-Cookie': `${dashboardCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` })
  }
  if (!requireDashboardAuth(req, res)) return

  const budgetDownloadMatch = pathname.match(/^\/api\/dashboard\/budget-downloads\/([^/]+)$/)
  if (budgetDownloadMatch) {
    const download = getBudgetOriginalDownloadById(decodeURIComponent(budgetDownloadMatch[1]))
    if (!download) return sendJson(res, 404, { error: 'Budget download not found' })
    return sendFile(res, download.absolutePath, { 'Content-Disposition': `attachment; filename="${download.fileName}"` })
  }

  try {
    if (pathname === '/api/dashboard/overview') return sendJson(res, 200, getDashboardOverview())
    if (pathname === '/api/dashboard/service-cards') return sendJson(res, 200, await getServiceCardsSection())
    if (pathname === '/api/dashboard/budget-runs') return sendJson(res, 200, getBudgetRunsSection())
    if (pathname === '/api/dashboard/budget-downloads') return sendJson(res, 200, getBudgetOriginalDownloadsSection(searchParams))
    if (pathname === '/api/dashboard/spending') { const spending = await getSpendingSnapshot(); return sendJson(res, 200, { ...spending, mode: 'live', detail: 'Live spending snapshot from Actual' }) }
    if (pathname === '/api/dashboard/fun-libs') return sendJson(res, 200, getFunLibsSection())
    if (pathname === '/api/dashboard/calendar') return sendJson(res, 200, getCalendarEvents())
    if (pathname === '/api/dashboard/weather') return sendJson(res, 200, await getWeather(getDashboardEnv().weatherProvider))
    if (pathname === '/api/dashboard/vps') return sendJson(res, 200, getVpsMetrics())
    return sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown dashboard error' })
  }
}

const server = createServer(async (req, res) => {
  let pathname = '/'
  let searchParams = new URLSearchParams()
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    pathname = decodeURIComponent(url.pathname)
    searchParams = url.searchParams
  } catch {
    res.writeHead(400)
    res.end('Bad request')
    return
  }
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname, searchParams)
  const candidate = path.join(distDir, pathname.replace(/^\/+/, ''))
  if (pathname !== '/' && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return sendFile(res, candidate)
  return sendFile(res, path.join(distDir, 'index.html'))
})

const port = Number(process.env.PORT || 3000)
server.listen(port, '0.0.0.0', () => {
  console.log(`albretsen.no server listening on http://0.0.0.0:${port}`)
})
