import type {
  BudgetRunsSection,
  CalendarState,
  DashboardOverview,
  FunLibsSection,
  ServiceCard,
  SpendingSection,
  WeatherData,
  DashboardMetric,
} from './types'

export type DashboardAuthStatus = {
  authenticated: boolean
  configured: boolean
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  return response.json()
}

export function fetchDashboardOverview() {
  return fetchJson<DashboardOverview>('/api/dashboard/overview')
}

export function fetchDashboardServiceCards() {
  return fetchJson<ServiceCard[]>('/api/dashboard/service-cards')
}

export function fetchDashboardBudgetRuns() {
  return fetchJson<BudgetRunsSection>('/api/dashboard/budget-runs')
}

export function fetchDashboardSpending() {
  return fetchJson<SpendingSection>('/api/dashboard/spending')
}

export function fetchDashboardFunLibs() {
  return fetchJson<FunLibsSection>('/api/dashboard/fun-libs')
}

export function fetchDashboardCalendar() {
  return fetchJson<CalendarState>('/api/dashboard/calendar')
}

export function fetchDashboardWeather() {
  return fetchJson<WeatherData>('/api/dashboard/weather')
}

export function fetchDashboardVpsMetrics() {
  return fetchJson<DashboardMetric[]>('/api/dashboard/vps')
}

export async function fetchDashboardAuthStatus(): Promise<DashboardAuthStatus> {
  return fetchJson<DashboardAuthStatus>('/api/dashboard/session')
}

export async function loginToDashboard(password: string): Promise<DashboardAuthStatus> {
  const response = await fetch('/api/dashboard/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Wrong password' : `Dashboard login failed with ${response.status}`)
  }

  return response.json()
}

export async function logoutFromDashboard(): Promise<void> {
  const response = await fetch('/api/dashboard/logout', {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Dashboard logout failed with ${response.status}`)
  }
}
