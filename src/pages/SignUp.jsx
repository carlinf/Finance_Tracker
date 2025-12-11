import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUpWithEmail, signInWithGoogle } from '../firebase/auth'
import { createUserProfile } from '../firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user, error: authError } = await signUpWithEmail(
        formData.email, 
        formData.password, 
        formData.fullName
      )
      
      if (authError) {
        setError(authError)
        setLoading(false)
        return
      }

      if (user) {
        // Create user profile in Firestore
        await createUserProfile(user.uid, {
          displayName: formData.fullName,
          email: formData.email
        })
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Failed to create account. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const { user, error: authError } = await signInWithGoogle()
      if (authError) {
        setError(authError)
        setLoading(false)
        return
      }
      if (user) {
        // Create user profile if it doesn't exist
        await createUserProfile(user.uid, {
          displayName: user.displayName || '',
          email: user.email || ''
        })
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Failed to sign up with Google. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7h6v6"></path>
              <path d="m22 7-8.5 8.5-5-5L2 17"></path>
            </svg>
          </div>
        </div>
        <h1 className="auth-title">Manage Your Money</h1>
        <p className="auth-description">
          Track expenses, visualize spending patterns, and take control of your finances with our intuitive personal finance tracker.
        </p>
        <ul className="auth-features">
          <li>Real-time expense tracking</li>
          <li>Smart analytics & insights</li>
          <li>Export & backup your data</li>
        </ul>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab">
              Sign In
            </Link>
            <Link to="/signup" className="auth-tab active">
              Create Account
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message" style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="8"
                  required
                  disabled={loading}
                />
              </div>
              <p className="password-hint">Password must be at least 8 characters long</p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>Or continue with</span>
          </div>

          <button 
            className="btn-google" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing Up...' : 'Google'}
          </button>

          <p className="terms-text">
            By signing up, you agree to our{' '}
            <a href="#" className="terms-link">Terms of Service</a> and{' '}
            <a href="#" className="terms-link">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
