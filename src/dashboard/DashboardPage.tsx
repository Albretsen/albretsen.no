import { useEffect, useState } from 'react'
import DashboardCard from './DashboardCard'
import { fetchDashboard } from './api'
import { dashboardMockData } from './mockData'
import type { DashboardPayload } from './types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload>(dashboardMockData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const payload = await fetchDashboard()
        if (!active) return
        setData(payload)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unknown dashboard error')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 120000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="dashboard-page">
      <div className="container dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="section-label">Personal dashboard</p>
            <h1>Dashboard</h1>
            <p className="dashboard-header__lead">
              Live where possible, explicit placeholders where the source is still being
              wired.
            </p>
            {error ? <p className="dashboard-banner">API fallback active: {error}</p> : null}
            {loading ? <p className="dashboard-banner">Loading latest dashboard data…</p> : null}
          </div>

          <div className="dashboard-header__meta">
            <div>
              <span>Freshness</span>
              <strong>{data.generatedAt}</strong>
            </div>
            <div>
              <span>Refresh</span>
              <strong>{data.lastRefresh}</strong>
            </div>
            <a className="button button--ghost dashboard-header__link" href="/">
              Back home
            </a>
          </div>
        </header>

        <section className="dashboard-grid dashboard-grid--top" aria-label="Overall status">
          {data.serviceCards.map((card) => (
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
            detail="Latest three runs from BudgetTools, with placeholder labels where needed"
            mode={data.budgetRuns.some((run) => run.mode === 'placeholder') ? 'placeholder' : 'live'}
            className="dashboard-card--wide"
          >
            <div className="run-list">
              {data.budgetRuns.map((run) => (
                <article className="run-item" key={`${run.timestamp}-${run.summary}`}>
                  <div className="run-item__topline">
                    <strong>{run.timestamp}</strong>
                    <div className="run-item__badges">
                      {run.mode === 'placeholder' ? (
                        <span className="mode-badge mode-badge--placeholder">Placeholder</span>
                      ) : null}
                      <span className={`result-pill result-pill--${run.result}`}>{run.result}</span>
                    </div>
                  </div>
                  <p>{run.summary}</p>
                  <span>{run.meta}</span>
                </article>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Spending overview"
            eyebrow="Priority"
            detail="Still placeholder until the spending source is wired"
            mode="placeholder"
            className="dashboard-card--wide"
          >
            <div className="metric-grid metric-grid--summary">
              {data.spendingMetrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <div className="bar-list" aria-label="Top spending categories">
              {data.spendingCategories.map((category) => (
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
          </DashboardCard>
        </section>

        <section className="dashboard-grid dashboard-grid--secondary" aria-label="Supporting details">
          <DashboardCard title="Fun Libs" detail="Explicitly kept as placeholder for now" mode="placeholder">
            <div className="metric-grid">
              {data.funLibsMetrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Today"
            detail={data.calendar.detail ?? 'Calendar via GOG'}
            status={data.calendar.status}
            mode={data.calendar.mode ?? 'placeholder'}
          >
            <div className="agenda-list">
              {data.calendar.events.map((event) => (
                <div className={`agenda-item${event.time === '—' ? ' agenda-item--placeholder' : ''}`} key={`${event.time}-${event.title}`}>
                  <strong>{event.time}</strong>
                  <div>
                    <p>{event.title}</p>
                    <span>{event.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Weather" detail="Still placeholder until weather source is wired" mode={data.weather.mode ?? 'placeholder'}>
            <div className="weather-card__value">{data.weather.temperature}</div>
            <p className="dashboard-summary">{data.weather.condition}</p>
            <div className="metric-grid metric-grid--weather">
              <div className="metric-tile">
                <span>Range</span>
                <strong>{data.weather.range}</strong>
              </div>
              <div className="metric-tile">
                <span>Detail</span>
                <strong>{data.weather.detail}</strong>
              </div>
            </div>
          </DashboardCard>
        </section>

        <section className="dashboard-grid" aria-label="Infrastructure overview">
          <DashboardCard
            title="VPS overview"
            detail="Live host metrics where available"
            mode={data.vpsMetrics.some((metric) => metric.value === 'Placeholder') ? 'placeholder' : 'live'}
            className="dashboard-card--wide"
          >
            <div className="metric-grid">
              {data.vpsMetrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </DashboardCard>
        </section>
      </div>
    </div>
  )
}
