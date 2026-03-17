import type { DashboardMetric, ServiceStatus } from './types'

export const generatedAt = 'Updated 13:37 UTC'
export const lastRefresh = 'Auto-refresh every 5 min'

export const serviceCards: Array<{
  title: string
  status: ServiceStatus
  detail: string
  summary: string
}> = [
  {
    title: 'BudgetTools',
    status: 'healthy',
    detail: 'Latest run completed successfully',
    summary: '4 sources processed · no action needed',
  },
  {
    title: 'Actual Budget',
    status: 'healthy',
    detail: 'App reachable and responding normally',
    summary: 'Last health check 2 min ago',
  },
  {
    title: 'albretsen.no',
    status: 'healthy',
    detail: 'Production site is up',
    summary: '184 ms response · dev also healthy',
  },
  {
    title: 'System health',
    status: 'warning',
    detail: 'RAM usage is elevated',
    summary: '6 / 8 containers healthy · review later',
  },
]

export const budgetRuns = [
  {
    timestamp: 'Today · 12:54',
    result: 'success',
    summary: 'Completed successfully. 4 accounts processed.',
    meta: 'Duration 2m 14s · Nordea, Amex, Sbanken, Cash',
  },
  {
    timestamp: 'Today · 08:02',
    result: 'partial',
    summary: 'Finished with warnings. Amex import skipped.',
    meta: 'Duration 1m 48s · 3 of 4 sources imported',
  },
  {
    timestamp: 'Yesterday · 22:11',
    result: 'failed',
    summary: 'Upload failed after extraction.',
    meta: 'Duration 49s · needs retry after auth refresh',
  },
]

export const spendingMetrics: DashboardMetric[] = [
  { label: 'This month', value: '31 480 NOK' },
  { label: 'Largest category', value: 'Food · 8 120 NOK' },
  { label: 'Budget drift', value: '+4.8%', tone: 'warning' },
]

export const spendingCategories = [
  { label: 'Food', value: '8 120 NOK', width: '82%' },
  { label: 'Housing', value: '7 480 NOK', width: '76%' },
  { label: 'Transport', value: '4 320 NOK', width: '44%' },
  { label: 'Subscriptions', value: '1 190 NOK', width: '12%' },
]

export const funLibsMetrics: DashboardMetric[] = [
  { label: 'Total users', value: '10.4k' },
  { label: 'Last 7d active', value: '1.2k' },
  { label: 'Stories created', value: '48.6k' },
  { label: 'Errors', value: '2', tone: 'warning' },
]

export const calendarEvents = [
  { time: '14:00', title: 'Project check-in', meta: 'Discord' },
  { time: '16:30', title: 'Walk + errands', meta: 'Personal' },
  { time: '19:00', title: 'Buffer for focused work', meta: 'No location' },
]

export const weather = {
  temperature: '7°C',
  condition: 'Light rain in Bergen',
  range: 'High 8° · Low 5°',
  detail: 'Wind 6 m/s · precipitation likely this afternoon',
}

export const vpsMetrics: DashboardMetric[] = [
  { label: 'CPU load', value: '0.84' },
  { label: 'RAM', value: '72%' },
  { label: 'Disk', value: '58%' },
  { label: 'Uptime', value: '14d 6h' },
  { label: 'Containers', value: '6 / 8 healthy', tone: 'warning' },
]
