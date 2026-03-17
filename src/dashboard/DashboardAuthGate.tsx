import { useState } from 'react'

type DashboardAuthGateProps = {
  configured: boolean
  loading: boolean
  error: string | null
  onSubmit: (password: string) => Promise<void>
}

export default function DashboardAuthGate({ configured, loading, error, onSubmit }: DashboardAuthGateProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(password)
  }

  return (
    <div className="dashboard-page dashboard-auth-page">
      <div className="container dashboard-auth-shell">
        <div className="dashboard-auth-card">
          <p className="section-label">Protected dashboard</p>
          <h1>Dashboard access</h1>
          <p className="dashboard-header__lead">
            This page is password-protected because it exposes private operational and personal data.
          </p>

          {!configured ? (
            <div className="dashboard-auth-note">
              Dashboard password is not configured on the server yet. Set `DASHBOARD_PASSWORD` in the environment used by the site.
            </div>
          ) : null}

          <form className="dashboard-auth-form" onSubmit={handleSubmit}>
            <label className="dashboard-auth-field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                disabled={!configured || loading}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            <button className="button button--primary" disabled={!configured || loading || !password.trim()} type="submit">
              {loading ? 'Unlocking…' : 'Unlock dashboard'}
            </button>
          </form>

          {error ? <p className="dashboard-banner">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
