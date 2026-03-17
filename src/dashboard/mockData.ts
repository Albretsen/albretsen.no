import type { DashboardPayload } from './types'

export const dashboardMockData: DashboardPayload = {
  generatedAt: 'Updated just now',
  lastRefresh: 'Auto-refresh every 5 min',
  serviceCards: [
    {
      title: 'BudgetTools',
      status: 'unknown',
      detail: 'Placeholder until live run data is loaded',
      summary: 'Using design-time sample content',
      mode: 'placeholder',
    },
    {
      title: 'Actual Budget',
      status: 'unknown',
      detail: 'Placeholder until live health checks are loaded',
      summary: 'Using design-time sample content',
      mode: 'placeholder',
    },
    {
      title: 'albretsen.no',
      status: 'unknown',
      detail: 'Placeholder until live health checks are loaded',
      summary: 'Using design-time sample content',
      mode: 'placeholder',
    },
    {
      title: 'System health',
      status: 'unknown',
      detail: 'Placeholder until live VPS metrics are loaded',
      summary: 'Using design-time sample content',
      mode: 'placeholder',
    },
  ],
  budgetRuns: [
    {
      timestamp: 'Placeholder',
      result: 'partial',
      summary: 'Sample BudgetTools entry for layout only.',
      meta: 'Waiting for live run ingestion',
      mode: 'placeholder',
    },
  ],
  spendingMetrics: [
    { label: 'This month', value: 'Placeholder' },
    { label: 'Largest category', value: 'Placeholder' },
    { label: 'Budget drift', value: 'Placeholder' },
  ],
  spendingCategories: [
    { label: 'Category data', value: 'Placeholder', width: '35%' },
  ],
  funLibsMetrics: [
    { label: 'Status', value: 'Waiting' },
    { label: 'Source', value: 'Not wired yet' },
  ],
  calendarEvents: [{ time: '—', title: 'Calendar placeholder', meta: 'Waiting for GOG data' }],
  weather: {
    temperature: '—',
    condition: 'Weather placeholder',
    range: 'Waiting for source wiring',
    detail: 'Not live yet',
    mode: 'placeholder',
  },
  vpsMetrics: [
    { label: 'CPU load', value: 'Placeholder' },
    { label: 'RAM', value: 'Placeholder' },
    { label: 'Disk', value: 'Placeholder' },
    { label: 'Uptime', value: 'Placeholder' },
  ],
}
