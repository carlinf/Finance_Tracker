import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [chartData, setChartData] = useState([])
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  // Sample data for the chart
  useEffect(() => {
    const data = [
      { date: 'Jan 1', balance: 2300 },
      { date: 'Jan 5', balance: 2100 },
      { date: 'Jan 10', balance: 2900 },
      { date: 'Jan 15', balance: 2000 },
      { date: 'Jan 20', balance: 2500 },
      { date: 'Jan 25', balance: 2800 },
      { date: 'Today', balance: 2750 }
    ]
    
    // Animate chart data entry
    const timer = setTimeout(() => {
      setChartData(data)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  const transactions = [
    {
      id: 1,
      name: 'Monthly Salary',
      category: 'Salary',
      amount: 5000.00,
      type: 'income',
      date: 'Dec 2',
      icon: '📈'
    },
    {
      id: 2,
      name: 'Coffee Shop',
      category: 'Food',
      amount: -4.50,
      type: 'expense',
      date: 'Dec 3',
      icon: '☕'
    },
    {
      id: 3,
      name: 'Grocery Store',
      category: 'Food',
      amount: -89.32,
      type: 'expense',
      date: 'Dec 4',
      icon: '🛒'
    },
    {
      id: 4,
      name: 'Netflix Subscription',
      category: 'Entertainment',
      amount: -15.99,
      type: 'expense',
      date: 'Dec 4',
      icon: '📺'
    },
    {
      id: 5,
      name: 'Freelance Project',
      category: 'Freelance',
      amount: 1200.00,
      type: 'income',
      date: 'Nov 29',
      icon: '💼'
    },
    {
      id: 6,
      name: 'Gas Station',
      category: 'Transport',
      amount: -45.00,
      type: 'expense',
      date: 'Nov 28',
      icon: '⛽'
    },
    {
      id: 7,
      name: 'Restaurant',
      category: 'Food',
      amount: -67.50,
      type: 'expense',
      date: 'Nov 27',
      icon: '🍽️'
    }
  ]

  const totalBalance = 8234.56
  const monthlyIncome = 6200.00
  const monthlyExpense = 1250.50

  const handleSignOut = () => {
    setShowSignOutModal(true)
  }

  const confirmSignOut = () => {
    setShowSignOutModal(false)
    navigate('/login')
  }

  const cancelSignOut = () => {
    setShowSignOutModal(false)
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Finance</h2>
          <p className="sidebar-subtitle">Personal Tracker</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </Link>
          <Link to="/transactions" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Transactions
          </Link>
          <Link to="/categories" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
              <line x1="2" y1="2" x2="7" y2="7"></line>
            </svg>
            Categories
          </Link>
          <Link to="/analytics" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </Link>
          <Link to="/settings" className="nav-item">
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

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="page-title">Dashboard</h1>
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">John Doe</span>
              <span className="user-email">john@example.com</span>
            </div>
            <div className="user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">Total Balance</span>
                <span className="card-icon">$</span>
              </div>
              <div className="card-amount">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">This Month Income</span>
                <svg className="card-icon income" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div className="card-amount income">+${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">This Month Expense</span>
                <svg className="card-icon expense" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
              </div>
              <div className="card-amount expense">-${monthlyExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="chart-section">
            <h2 className="section-title">Balance Trend</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 3000]}
                    ticks={[0, 750, 1500, 2250, 3000]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="transactions-section">
            <div className="section-header">
              <h2 className="section-title">Recent Transactions</h2>
              <button className="btn-add-transaction">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Transaction
              </button>
            </div>

            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon">{transaction.icon}</div>
                  <div className="transaction-details">
                    <div className="transaction-name">{transaction.name}</div>
                    <div className="transaction-category">{transaction.category}</div>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="transaction-date">{transaction.date}</div>
                </div>
              ))}
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

export default Dashboard

