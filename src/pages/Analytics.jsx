import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOutUser } from '../firebase/auth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './Analytics.css'

function Analytics() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleSignOut = () => {
    setShowSignOutModal(true)
    setIsProfileDropdownOpen(false)
  }

  const confirmSignOut = async () => {
    const { error } = await signOutUser()
    if (!error) {
      setShowSignOutModal(false)
      navigate('/login')
    }
  }

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.user-info')) {
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileDropdownOpen])

  const cancelSignOut = () => {
    setShowSignOutModal(false)
  }

  // Bar chart data for Income vs Expense
  const barChartData = [
    { month: 'Jan', income: 4000, expense: 2200 },
    { month: 'Feb', income: 2800, expense: 1500 },
    { month: 'Mar', income: 2000, expense: 9800 },
    { month: 'Apr', income: 2800, expense: 3800 },
    { month: 'May', income: 2200, expense: 4800 },
    { month: 'Jun', income: 2000, expense: 3800 }
  ]

  // Pie chart data for Spending by Category
  const pieChartData = [
    { name: 'Food', value: 450, color: '#10b981' },
    { name: 'Transportation', value: 320, color: '#3b82f6' },
    { name: 'Entertainment', value: 280, color: '#f59e0b' },
    { name: 'Utilities', value: 200, color: '#ef4444' },
    { name: 'Other', value: 150, color: '#8b5cf6' }
  ]

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="analytics-container">
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}
      
      <aside className={`sidebar ${isMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2 className="sidebar-title">Finance</h2>
            <p className="sidebar-subtitle">Personal Tracker</p>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </Link>
          <Link to="/transactions" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Transactions
          </Link>
          <Link to="/categories" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
              <line x1="2" y1="2" x2="7" y2="7"></line>
            </svg>
            Categories
          </Link>
          <Link to="/analytics" className="nav-item active" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </Link>
          <Link to="/settings" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Settings
          </Link>
        </nav>

        <button className="sign-out-btn" onClick={handleSignOut}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </aside>

      <main className="analytics-main">
        <header className="analytics-header">
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="page-title">Analytics</h1>
          <div className="user-info" onClick={toggleProfileDropdown}>
            <div className="user-details">
              <span className="user-name">{currentUser?.displayName || 'User'}</span>
              <span className="user-email">{currentUser?.email || ''}</span>
            </div>
            <div className="user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <button className="profile-dropdown-item" onClick={handleSignOut}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="analytics-content">
          <div className="analytics-page-header">
            <div className="page-header-left">
              <h2 className="analytics-page-title">Analytics</h2>
              <p className="analytics-page-subtitle">Visualize your spending patterns and financial insights</p>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Top Category</span>
                <div className="metric-icon income">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
              </div>
              <div className="metric-value">$450.00</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Total Income (YTD)</span>
                <div className="metric-icon income">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
              </div>
              <div className="metric-value income">$20,940.00</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Total Expense (YTD)</span>
                <div className="metric-icon expense">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </svg>
                </div>
              </div>
              <div className="metric-value expense">$10,606.00</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Income vs Expense</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Spending by Category</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => `$${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="summary-card">
            <h3 className="chart-title">Summary</h3>
            <div className="summary-metrics">
              <div className="summary-metric">
                <span className="summary-label">Savings Rate</span>
                <span className="summary-value income">52%</span>
              </div>
              <div className="summary-metric">
                <span className="summary-label">Average Monthly Expense</span>
                <span className="summary-value">$1,767.67</span>
              </div>
              <div className="summary-metric">
                <span className="summary-label">Average Monthly Income</span>
                <span className="summary-value">$3,490.00</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sign Out Modal */}
      {showSignOutModal && (
        <div className="modal-overlay" onClick={cancelSignOut}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Sign Out?</h2>
            <p className="modal-message">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={cancelSignOut}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
