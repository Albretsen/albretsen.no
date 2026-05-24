import type { DashboardPayload } from './types'

export async function fetchDashboard(): Promise<DashboardPayload> {
  const response = await fetch('/api/dashboard', {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Dashboard request failed with ${response.status}`)
  }

  return response.json()
}
