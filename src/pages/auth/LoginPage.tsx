import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const LoginPage = () => {
  const { user, profile, loading: authLoading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/student'} replace />
  }

  if (user && authLoading) {
    return (
      <div className="center-message">
        Loading your account...
      </div>
    )
  }

  if (user && !profile) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <h1>Account Setup In Progress</h1>
          <p>
            Your sign-in was successful, but your student profile is still being initialized.
            Please refresh in a few seconds.
          </p>
        </section>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Health Sciences Library Portal</h1>
        <p><b>College of Medicine</b></p>
        <p>Note: This is a backup system in case <b>OPAC</b> is unavailable</p>

        {location.state?.message ? <p className="success-text">{location.state.message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p>
          No account yet? <Link to="/register">Register as student</Link>
        </p>
        <p className="credit-text">Developed by: Bradley Soloria</p>
      </section>
    </div>
  )
}
