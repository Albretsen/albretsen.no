import type { DashboardCardProps } from './types'

const statusLabel: Record<NonNullable<DashboardCardProps['status']>, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  error: 'Error',
  unknown: 'Unknown',
}

export default function DashboardCard({
  title,
  eyebrow,
  status,
  detail,
  children,
  footer,
  className,
}: DashboardCardProps) {
  return (
    <article className={`dashboard-card${className ? ` ${className}` : ''}`}>
      <header className="dashboard-card__header">
        <div>
          {eyebrow ? <p className="card__eyebrow">{eyebrow}</p> : null}
          <h2 className="dashboard-card__title">{title}</h2>
          {detail ? <p className="dashboard-card__detail">{detail}</p> : null}
        </div>

        {status ? (
          <span className={`status-badge status-badge--${status}`}>
            <span className="status-badge__dot" aria-hidden="true" />
            {statusLabel[status]}
          </span>
        ) : null}
      </header>

      <div className="dashboard-card__content">{children}</div>
      {footer ? <footer className="dashboard-card__footer">{footer}</footer> : null}
    </article>
  )
}
