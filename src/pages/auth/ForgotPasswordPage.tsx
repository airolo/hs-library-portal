import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await resetPassword(email)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('If an account exists for that email, a password reset link has been sent.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page-login">
      <div className="auth-shell">
        <aside className="auth-hero">
          <p className="auth-kicker">Health Sciences Library</p>
          <h1>Reset Your Password</h1>
          <p className="auth-hero-copy">Enter your campus email and we'll send a link to reset your password.</p>
        </aside>

        <section className="auth-card auth-card-modern">
          <h2>Forgot Password</h2>

          {message ? <p className="success-text auth-status">{message}</p> : null}
          {error ? <p className="error-text auth-status">{error}</p> : null}

          <form onSubmit={handleSubmit} className="form-grid auth-form">
            <label>
              Email
              <input
                type="email"
                placeholder="name@bicol-u.edu.ph"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="auth-link-row">
            <Link to="/login">Back to Login</Link>
          </p>
          <p className="credit-text">Developed by: Bradley Soloria</p>
        </section>
      </div>
    </div>
  )
}
