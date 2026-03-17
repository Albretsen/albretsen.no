export type ServiceStatus = 'healthy' | 'warning' | 'error' | 'unknown'

export type DashboardMetric = {
  label: string
  value: string
  tone?: ServiceStatus
}

export type DashboardSectionState = 'live' | 'stale' | 'error'

export type DashboardCardProps = {
  title: string
  eyebrow?: string
  status?: ServiceStatus
  detail?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}
