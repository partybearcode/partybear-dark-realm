import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AuthPage.css'

function AuthPage() {
  const { currentUser, register, login, signInWithGoogle } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    displayName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (currentUser) {
    return <Navigate to="/profile" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(formState)
      } else {
        await login(formState.email, formState.password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-enter">
        <h1>{isRegister ? 'Create Account' : 'Login'}</h1>
        <p>Join the Dark Realm to track XP and achievements.</p>
        <form onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              Display Name
              <input
                type="text"
                name="displayName"
                value={formState.displayName}
                onChange={handleChange}
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              required
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          type="button"
          className="google-button"
          onClick={handleGoogle}
          disabled={loading}
        >
          Sign in with Google
        </button>
        <button
          type="button"
          className="auth-toggle"
          onClick={() => setIsRegister((prev) => !prev)}
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </section>
    </main>
  )
}

export default AuthPage
