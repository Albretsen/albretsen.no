import type { DashboardPayload } from './types'

export type DashboardAuthStatus = {
  authenticated: boolean
  configured: boolean
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  const response = await fetch('/api/dashboard', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Dashboard request failed with ${response.status}`)
  }

  return response.json()
}

export async function fetchDashboardAuthStatus(): Promise<DashboardAuthStatus> {
  const response = await fetch('/api/dashboard/session', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Dashboard session request failed with ${response.status}`)
  }

  return response.json()
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
