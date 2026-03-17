import DashboardCard from './DashboardCard'
import {
  budgetRuns,
  calendarEvents,
  funLibsMetrics,
  generatedAt,
  lastRefresh,
  serviceCards,
  spendingCategories,
  spendingMetrics,
  vpsMetrics,
  weather,
} from './mockData'

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="container dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="section-label">Personal dashboard</p>
            <h1>Dashboard</h1>
            <p className="dashboard-header__lead">
              A first pass at the operations view described in the design doc: calm,
              readable, and useful at a glance on a tablet.
            </p>
          </div>

          <div className="dashboard-header__meta">
            <div>
              <span>Freshness</span>
              <strong>{generatedAt}</strong>
            </div>
            <div>
              <span>Refresh</span>
              <strong>{lastRefresh}</strong>
            </div>
            <a className="button button--ghost dashboard-header__link" href="/">
              Back home
            </a>
          </div>
        </header>

        <section className="dashboard-grid dashboard-grid--top" aria-label="Overall status">
          {serviceCards.map((card) => (
            <DashboardCard
              key={card.title}
              title={card.title}
              status={card.status}
              detail={card.detail}
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
            detail="Latest three runs, with quick context instead of logs"
            className="dashboard-card--wide"
          >
            <div className="run-list">
              {budgetRuns.map((run) => (
                <article className="run-item" key={`${run.timestamp}-${run.summary}`}>
                  <div className="run-item__topline">
                    <strong>{run.timestamp}</strong>
                    <span className={`result-pill result-pill--${run.result}`}>{run.result}</span>
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
            detail="Mock-backed structure for the budget report summary"
            className="dashboard-card--wide"
          >
            <div className="metric-grid metric-grid--summary">
              {spendingMetrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <div className="bar-list" aria-label="Top spending categories">
              {spendingCategories.map((category) => (
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
          <DashboardCard title="Fun Libs" detail="Top-level product signals from the app">
            <div className="metric-grid">
              {funLibsMetrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Today" detail="Current-day agenda, not a full calendar UI">
            <div className="agenda-list">
              {calendarEvents.map((event) => (
                <div className="agenda-item" key={`${event.time}-${event.title}`}>
                  <strong>{event.time}</strong>
                  <div>
                    <p>{event.title}</p>
                    <span>{event.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Weather" detail="Compact Bergen weather card">
            <div className="weather-card__value">{weather.temperature}</div>
            <p className="dashboard-summary">{weather.condition}</p>
            <div className="metric-grid metric-grid--weather">
              <div className="metric-tile">
                <span>Range</span>
                <strong>{weather.range}</strong>
              </div>
              <div className="metric-tile">
                <span>Detail</span>
                <strong>{weather.detail}</strong>
              </div>
            </div>
          </DashboardCard>
        </section>

        <section className="dashboard-grid" aria-label="Infrastructure overview">
          <DashboardCard
            title="VPS overview"
            detail="High-signal operational details only"
            className="dashboard-card--wide"
          >
            <div className="metric-grid">
              {vpsMetrics.map((metric) => (
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
