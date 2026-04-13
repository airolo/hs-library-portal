import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const RegisterPage = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [program, setProgram] = useState('')
  const [yearLevel, setYearLevel] = useState<number>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const programOptions = ['Nursing', 'Dentistry', 'Medicine']
  const yearLevelOptions = [1, 2, 3, 4]

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
      fullName,
      program,
      yearLevel,
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
    <div className="auth-page">
      <section className="auth-card">
        <h1>Student Registration</h1>
        <p>Create your library portal account</p>

        {error ? <p className="error-text">{error}</p> : null}

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Full Name
            <input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
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
            Year Level
            <select
              required
              value={String(yearLevel)}
              onChange={(event) => setYearLevel(Number(event.target.value))}
            >
              {yearLevelOptions.map((option) => (
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
            />
            <small>Use your school account only: @bicol-u.edu.ph</small>
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p>
          Have an account? <Link to="/login">Back to login</Link>
        </p>
        <p className="credit-text">Developed by: Bradley Soloria</p>
      </section>
    </div>
  )
}
