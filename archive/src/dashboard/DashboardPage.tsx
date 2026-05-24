import { useEffect, useMemo, useState } from 'react'
import {
  fetchDashboardAuthStatus,
  fetchDashboardBudgetRuns,
  fetchDashboardBudgetDownloads,
  fetchDashboardCalendar,
  fetchDashboardFunLibs,
  fetchDashboardOverview,
  fetchDashboardServiceCards,
  fetchDashboardSpending,
  fetchDashboardVpsMetrics,
  fetchDashboardWeather,
  loginToDashboard,
  logoutFromDashboard,
} from './api'
import DashboardAuthGate from './DashboardAuthGate'
import DashboardCard from './DashboardCard'
import type {
  BudgetRunsSection,
  BudgetDownloadsSection,
  CalendarState,
  DashboardMetric,
  DashboardOverview,
  FunLibsSection,
  ServiceCard,
  SpendingSection,
  WeatherData,
} from './types'

type ResourceState<T> = {
  loading: boolean
  data: T
  error: string | null
}

function useDashboardResource<T>(loader: () => Promise<T>, initialData: T, enabled: boolean) {
  const [state, setState] = useState<ResourceState<T>>({
    loading: enabled,
    data: initialData,
    error: null,
  })

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: initialData, error: null })
      return
    }

    let active = true

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }))
      try {
        const data = await loader()
        if (!active) return
        setState({ loading: false, data, error: null })
      } catch (error) {
        if (!active) return
        setState((current) => ({
          loading: false,
          data: current.data,
          error: error instanceof Error ? error.message : 'Unknown dashboard error',
        }))
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 120000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [enabled, initialData, loader])

  return state
}

function SkeletonLines({ count = 3, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div className={`dashboard-skeleton-list${compact ? ' dashboard-skeleton-list--compact' : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div className="dashboard-skeleton-line" key={index} />
      ))}
    </div>
  )
}

function DashboardCardSkeleton({ blocks = 3, compact = false }: { blocks?: number; compact?: boolean }) {
  return (
    <div className="dashboard-skeleton-card" aria-hidden="true">
      <div className="dashboard-skeleton-heading" />
      <SkeletonLines count={blocks} compact={compact} />
    </div>
  )
}

const overviewInitial: DashboardOverview = {
  generatedAt: 'Loading…',
  lastRefresh: 'Waiting for first response',
}

const serviceCardsInitial: ServiceCard[] = []
const budgetRunsInitial: BudgetRunsSection = { mode: 'placeholder', runs: [] }
const budgetDownloadsInitial: BudgetDownloadsSection = { mode: 'placeholder', detail: 'Loading archived CSV downloads…', files: [], query: '', page: 1, pageSize: 12, totalFiles: 0, totalPages: 1 }
const spendingInitial: SpendingSection = { mode: 'placeholder', detail: 'Loading spending…', metrics: [], categories: [] }
const funLibsInitial: FunLibsSection = { mode: 'placeholder', detail: 'Loading…', metrics: [] }
const calendarInitial: CalendarState = { mode: 'placeholder', status: 'unknown', detail: 'Loading calendar…', events: [] }
const weatherInitial: WeatherData = { temperature: '—', condition: 'Loading weather…', range: 'Loading…', detail: 'Loading…', mode: 'placeholder' }
const vpsInitial: DashboardMetric[] = []

export default function DashboardPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authConfigured, setAuthConfigured] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadAuth = async () => {
      try {
        const auth = await fetchDashboardAuthStatus()
        if (!active) return
        setAuthenticated(auth.authenticated)
        setAuthConfigured(auth.configured)
      } catch (error) {
        if (!active) return
        setAuthError(error instanceof Error ? error.message : 'Could not validate dashboard session')
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    void loadAuth()
    return () => {
      active = false
    }
  }, [])

  const [budgetDownloadQueryInput, setBudgetDownloadQueryInput] = useState('')
  const [budgetDownloadQuery, setBudgetDownloadQuery] = useState('')
  const [budgetDownloadPage, setBudgetDownloadPage] = useState(1)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextQuery = budgetDownloadQueryInput.trim()
      setBudgetDownloadQuery((current) => {
        if (current === nextQuery) return current
        setBudgetDownloadPage(1)
        return nextQuery
      })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [budgetDownloadQueryInput])

  const loadBudgetDownloads = useMemo(
    () => () => fetchDashboardBudgetDownloads(budgetDownloadQuery, budgetDownloadPage),
    [budgetDownloadPage, budgetDownloadQuery],
  )

  const overview = useDashboardResource(fetchDashboardOverview, overviewInitial, authenticated)
  const serviceCards = useDashboardResource(fetchDashboardServiceCards, serviceCardsInitial, authenticated)
  const budgetRuns = useDashboardResource(fetchDashboardBudgetRuns, budgetRunsInitial, authenticated)
  const spending = useDashboardResource(fetchDashboardSpending, spendingInitial, authenticated)
  const budgetDownloads = useDashboardResource(loadBudgetDownloads, budgetDownloadsInitial, authenticated)
  const funLibs = useDashboardResource(fetchDashboardFunLibs, funLibsInitial, authenticated)
  const calendar = useDashboardResource(fetchDashboardCalendar, calendarInitial, authenticated)
  const weather = useDashboardResource(fetchDashboardWeather, weatherInitial, authenticated)
  const vpsMetrics = useDashboardResource(fetchDashboardVpsMetrics, vpsInitial, authenticated)

  const handleLogin = async (password: string) => {
    setAuthLoading(true)
    setAuthError(null)

    try {
      await loginToDashboard(password)
      setAuthenticated(true)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Dashboard login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutFromDashboard()
    setAuthenticated(false)
  }

  if (!authenticated) {
    return (
      <DashboardAuthGate
        configured={authConfigured}
        error={authError}
        loading={authLoading}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <div className="dashboard-page">
      <div className="container dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="section-label">Personal dashboard</p>
            <h1>Dashboard</h1>
            <p className="dashboard-header__lead">
              Each card loads independently, so slow sources do not block the rest of the page.
            </p>
            {authError ? <p className="dashboard-banner">{authError}</p> : null}
          </div>

          <div className="dashboard-header__meta">
            <div>
              <span>Freshness</span>
              <strong>{overview.data.generatedAt}</strong>
            </div>
            <div>
              <span>Refresh</span>
              <strong>{overview.data.lastRefresh}</strong>
            </div>
            <div className="dashboard-header__actions">
              <button className="button button--ghost dashboard-header__link" onClick={() => void handleLogout()} type="button">
                Lock dashboard
              </button>
              <a className="button button--ghost dashboard-header__link" href="/">
                Back home
              </a>
            </div>
          </div>
        </header>

        <section className="dashboard-grid dashboard-grid--top" aria-label="Overall status">
          {serviceCards.loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <DashboardCard key={index} title="Loading" detail="Checking service health…" className="dashboard-card--compact" mode="placeholder">
                  <DashboardCardSkeleton blocks={2} compact />
                </DashboardCard>
              ))
            : serviceCards.data.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  status={card.status}
                  detail={card.detail}
                  mode={card.mode}
                  className="dashboard-card--compact"
                >
                  <p className="dashboard-summary">{card.summary}</p>
                </DashboardCard>
              ))}
        </section>

        <section className="dashboard-grid dashboard-grid--main" aria-label="Budget and spending">
          <DashboardCard
            title="Recent BudgetTools runs"
            eyebrow="Priority"
            detail={budgetRuns.loading ? 'Checking recent runs…' : 'Latest three runs from BudgetTools'}
            mode={budgetRuns.data.mode ?? 'live'}
            className="dashboard-card--wide"
          >
            {budgetRuns.loading ? (
              <DashboardCardSkeleton blocks={3} />
            ) : (
              <div className="run-list">
                {budgetRuns.data.runs.map((run) => (
                  <article className="run-item" key={`${run.timestamp}-${run.summary}`}>
                    <div className="run-item__topline">
                      <strong>{run.timestamp}</strong>
                      <div className="run-item__badges">
                        {run.mode === 'placeholder' ? <span className="mode-badge mode-badge--placeholder">Placeholder</span> : null}
                        <span className={`result-pill result-pill--${run.result}`}>{run.result}</span>
                      </div>
                    </div>
                    <p>{run.summary}</p>
                    <span>{run.meta}</span>
                  </article>
                ))}
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="Original CSV downloads"
            eyebrow="Archive"
            detail={budgetDownloads.loading ? 'Loading archived originals…' : budgetDownloads.data.detail ?? 'Archived original downloaded CSV files'}
            mode={budgetDownloads.data.mode ?? 'live'}
            className="dashboard-card--wide"
          >
            <div className="archive-toolbar">
              <label className="archive-search">
                <span>Search date or filename</span>
                <input
                  type="search"
                  inputMode="search"
                  placeholder="2026-05-08, amex, spv…"
                  value={budgetDownloadQueryInput}
                  onChange={(event) => setBudgetDownloadQueryInput(event.target.value)}
                />
              </label>
              <span className="archive-toolbar__meta">
                {budgetDownloads.data.totalFiles} file{budgetDownloads.data.totalFiles === 1 ? '' : 's'}
              </span>
            </div>

            {budgetDownloads.loading ? (
              <DashboardCardSkeleton blocks={4} />
            ) : budgetDownloads.data.files.length ? (
              <>
                <div className="run-list">
                  {budgetDownloads.data.files.map((file) => (
                    <article className="run-item" key={file.id}>
                      <div className="run-item__topline">
                        <strong>{file.account}</strong>
                        <div className="run-item__badges">
                          {file.mode === 'placeholder' ? <span className="mode-badge mode-badge--placeholder">Placeholder</span> : null}
                          <a className="button button--ghost dashboard-header__link" href={`/api/dashboard/budget-downloads/${encodeURIComponent(file.id)}`}>
                            Download
                          </a>
                        </div>
                      </div>
                      <p>{file.fileName}</p>
                      <span>{file.timestamp} · {file.sizeLabel}</span>
                    </article>
                  ))}
                </div>

                <div className="archive-pagination">
                  <button
                    className="button button--ghost dashboard-header__link"
                    type="button"
                    onClick={() => setBudgetDownloadPage((page) => Math.max(1, page - 1))}
                    disabled={budgetDownloads.data.page <= 1 || budgetDownloads.loading}
                  >
                    Previous
                  </button>
                  <span className="archive-pagination__status">
                    Page {budgetDownloads.data.page} of {budgetDownloads.data.totalPages}
                  </span>
                  <button
                    className="button button--ghost dashboard-header__link"
                    type="button"
                    onClick={() => setBudgetDownloadPage((page) => Math.min(budgetDownloads.data.totalPages, page + 1))}
                    disabled={budgetDownloads.data.page >= budgetDownloads.data.totalPages || budgetDownloads.loading}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="dashboard-summary">
                {budgetDownloads.data.query ? 'No archived CSV files matched that search.' : 'No archived original CSV files yet.'}
              </p>
            )}
          </DashboardCard>

          <DashboardCard
            title="Spending overview"
            eyebrow="Priority"
            detail={spending.loading ? 'Pulling current Actual data…' : spending.data.detail ?? 'Live spending snapshot from Actual'}
            mode={spending.data.mode ?? 'live'}
            className="dashboard-card--wide"
          >
            {spending.loading ? (
              <DashboardCardSkeleton blocks={4} />
            ) : (
              <>
                <div className="metric-grid metric-grid--summary">
                  {spending.data.metrics.map((metric) => (
                    <div className="metric-tile" key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="bar-list" aria-label="Top spending categories">
                  {spending.data.categories.map((category) => (
                    <div className="bar-list__item" key={category.label}>
                      <div className="bar-list__meta">
                        <span>{category.label}</span>
                        <strong>{category.value}</strong>
                      </div>
                      <div className="bar-list__track" aria-hidden="true">
                        <div className="bar-list__fill" style={{ width: category.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </DashboardCard>
        </section>

        <section className="dashboard-grid dashboard-grid--secondary" aria-label="Supporting details">
          <DashboardCard title="Fun Libs" detail={funLibs.loading ? 'Loading source state…' : funLibs.data.detail ?? 'Explicitly kept as placeholder for now'} mode={funLibs.data.mode ?? 'placeholder'}>
            {funLibs.loading ? (
              <DashboardCardSkeleton blocks={2} />
            ) : (
              <div className="metric-grid">
                {funLibs.data.metrics.map((metric) => (
                  <div className="metric-tile" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="Today" detail={calendar.loading ? 'Loading calendar…' : calendar.data.detail ?? 'Calendar via GOG'} status={calendar.data.status} mode={calendar.data.mode ?? 'placeholder'}>
            {calendar.loading ? (
              <DashboardCardSkeleton blocks={3} />
            ) : (
              <div className="agenda-list">
                {calendar.data.events.map((event) => (
                  <div className={`agenda-item${event.time === '—' ? ' agenda-item--placeholder' : ''}`} key={`${event.time}-${event.title}`}>
                    <strong>{event.time}</strong>
                    <div>
                      <p>{event.title}</p>
                      <span>{event.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="Weather" detail={weather.loading ? 'Fetching weather…' : weather.data.detail} mode={weather.data.mode ?? 'placeholder'}>
            {weather.loading ? (
              <DashboardCardSkeleton blocks={3} />
            ) : (
              <>
                <div className="weather-card__value">{weather.data.temperature}</div>
                <p className="dashboard-summary">{weather.data.condition}</p>
                <div className="metric-grid metric-grid--weather">
                  <div className="metric-tile">
                    <span>Range</span>
                    <strong>{weather.data.range}</strong>
                  </div>
                  <div className="metric-tile">
                    <span>Detail</span>
                    <strong>{weather.data.detail}</strong>
                  </div>
                </div>
              </>
            )}
          </DashboardCard>
        </section>

        <section className="dashboard-grid" aria-label="Infrastructure overview">
          <DashboardCard title="VPS overview" detail={vpsMetrics.loading ? 'Polling live host metrics…' : 'Live host metrics where available'} mode="live" className="dashboard-card--wide">
            {vpsMetrics.loading ? (
              <DashboardCardSkeleton blocks={4} />
            ) : (
              <div className="metric-grid">
                {vpsMetrics.data.map((metric) => (
                  <div className="metric-tile" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </section>
      </div>
    </div>
  )
}
