import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const RegisterPage = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [program, setProgram] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const programOptions = ['Nursing', 'Dentistry', 'Medicine']

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail.endsWith('@bicol-u.edu.ph')) {
      setError('Use your official school email account ending in @bicol-u.edu.ph.')
      setLoading(false)
      return
    }

    const result = await signUp({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      program,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    navigate('/login', {
      state: {
        message: 'Registration successful. Check your email if confirmation is enabled, then sign in.',
      },
    })
  }

  return (
    <div className="auth-page auth-page-register">
      <div className="auth-shell">
        <aside className="auth-hero">
          <p className="auth-kicker">Student Registration</p>
          <h1>Join the portal with a cleaner, more modern sign-up flow.</h1>
          <p className="auth-hero-copy">
            Create your library account once, then use it for books, journals, suggestions, and
             view announcements in one place.
          </p>

          <div className="auth-hero-pills">
            <span>Official School Email</span>
            <span>Quick Setup</span>
            <span>Portal Access</span>
          </div>
        </aside>

        <section className="auth-card auth-card-modern">
          <h2>Create your account</h2>
          <p>Complete the form below to register.</p>

          {error ? <p className="error-text auth-status">{error}</p> : null}

          <form onSubmit={handleSubmit} className="form-grid auth-form">
            <div className="two-column-grid">
              <label>
                First Name
                <input
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Enter first name"
                />
              </label>
              <label>
                Last Name
                <input
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Enter last name"
                />
              </label>
            </div>
            <label>
              Program
              <select required value={program} onChange={(event) => setProgram(event.target.value)}>
                <option value="">Select Program</option>
                {programOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@bicol-u.edu.ph"
              />
              <small>Use your school email account only: @bicol-u.edu.ph</small>
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
              />
            </label>
            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="auth-link-row">
            Have an account? <Link to="/login">Back to login</Link>
          </p>
          <p className="credit-text">Developed by: Bradley Soloria</p>
        </section>
      </div>
    </div>
  )
}
