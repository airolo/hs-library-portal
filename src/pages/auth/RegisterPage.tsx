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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signUp({
      email,
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
            <input required value={program} onChange={(event) => setProgram(event.target.value)} />
          </label>
          <label>
            Year Level
            <input
              type="number"
              min={1}
              max={10}
              required
              value={yearLevel}
              onChange={(event) => setYearLevel(Number(event.target.value))}
            />
          </label>
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
      </section>
    </div>
  )
}
