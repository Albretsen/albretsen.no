import type { ReactNode } from 'react'

export type ServiceStatus = 'healthy' | 'warning' | 'error' | 'unknown'
export type DataMode = 'live' | 'placeholder'

export type DashboardMetric = {
  label: string
  value: string
  tone?: ServiceStatus
}

export type DashboardCardProps = {
  title: string
  eyebrow?: string
  status?: ServiceStatus
  detail?: string
  mode?: DataMode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export type DashboardOverview = {
  generatedAt: string
  lastRefresh: string
}

export type ServiceCard = {
  title: string
  status: ServiceStatus
  detail: string
  summary: string
  mode?: DataMode
}

export type BudgetRun = {
  timestamp: string
  result: 'success' | 'partial' | 'failed'
  summary: string
  meta: string
  mode?: DataMode
}

export type BudgetRunsSection = {
  mode?: DataMode
  runs: BudgetRun[]
}

export type SpendingSection = {
  mode?: DataMode
  detail?: string
  metrics: DashboardMetric[]
  categories: Array<{ label: string; value: string; width: string }>
}

export type CalendarEvent = {
  time: string
  title: string
  meta: string
}

export type CalendarState = {
  mode?: DataMode
  status?: ServiceStatus
  detail?: string
  events: CalendarEvent[]
}

export type WeatherData = {
  temperature: string
  condition: string
  range: string
  detail: string
  mode?: DataMode
}

export type FunLibsSection = {
  mode?: DataMode
  detail?: string
  metrics: DashboardMetric[]
}

export type DashboardPayload = DashboardOverview & {
  serviceCards: ServiceCard[]
  budgetRuns: BudgetRun[]
  spendingMetrics: SpendingSection['metrics']
  spendingCategories: SpendingSection['categories']
  funLibsMetrics: FunLibsSection['metrics']
  calendar: CalendarState
  weather: WeatherData
  vpsMetrics: DashboardMetric[]
}
