import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { signOutUser } from '../firebase/auth'
import { subscribeToTransactions } from '../firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './Analytics.css'

// Helper function to assign colors to categories
const getCategoryColor = (categoryName) => {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280']
  const index = categoryName.charCodeAt(0) % colors.length
  return colors[index]
}

function Analytics() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { formatCurrency } = useCurrency()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Subscribe to transactions from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    console.log('Subscribing to transactions for analytics:', currentUser.uid)
    const unsubscribe = subscribeToTransactions(currentUser.uid, (fetchedTransactions) => {
      setTransactions(fetchedTransactions)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const handleSignOut = () => {
    setShowSignOutModal(true)
  }

  const confirmSignOut = async () => {
    const { error } = await signOutUser()
    if (!error) {
      setShowSignOutModal(false)
      navigate('/login')
    }
  }

  const cancelSignOut = () => {
    setShowSignOutModal(false)
  }

  // Get current year and calculate year-to-date
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Process transactions for analytics
  const analyticsData = useMemo(() => {
    // Filter transactions for current year
    const yearTransactions = transactions.filter(t => {
      if (!t.createdAt) return false
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
      return date.getFullYear() === currentYear
    })

    // Separate income and expenses
    const incomes = yearTransactions.filter(t => (t.amount || 0) > 0)
    const expenses = yearTransactions.filter(t => (t.amount || 0) < 0)

    // Calculate totals
    const totalIncome = incomes.reduce((sum, t) => sum + (t.amount || 0), 0)
    const totalExpense = Math.abs(expenses.reduce((sum, t) => sum + (t.amount || 0), 0))

    // Group by month for bar chart
    const monthlyData = {}
    for (let i = 0; i <= currentMonth; i++) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      monthlyData[i] = {
        month: monthNames[i],
        income: 0,
        expense: 0
      }
    }

    yearTransactions.forEach(t => {
      if (!t.createdAt) return
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
      const month = date.getMonth()
      
      if (month <= currentMonth) {
        if ((t.amount || 0) > 0) {
          monthlyData[month].income += t.amount || 0
        } else {
          monthlyData[month].expense += Math.abs(t.amount || 0)
        }
      }
    })

    const barChartData = Object.values(monthlyData)

    // Group expenses by category for pie chart
    const categoryMap = new Map()
    expenses.forEach(t => {
      const category = t.category || 'Uncategorized'
      const amount = Math.abs(t.amount || 0)
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + amount)
      } else {
        categoryMap.set(category, amount)
      }
    })

    // Convert to array and sort by value
    const pieChartData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 categories

    // Find top spending category
    const topCategory = pieChartData.length > 0 ? pieChartData[0] : { name: 'N/A', value: 0 }

    // Calculate averages
    const monthsWithData = barChartData.filter(m => m.income > 0 || m.expense > 0).length || 1
    const avgMonthlyIncome = totalIncome / monthsWithData
    const avgMonthlyExpense = totalExpense / monthsWithData

    // Calculate savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0

    return {
      barChartData,
      pieChartData,
      totalIncome,
      totalExpense,
      topCategory,
      avgMonthlyIncome,
      avgMonthlyExpense,
      savingsRate
    }
  }, [transactions, currentYear, currentMonth])

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
          <div className="user-info">
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
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading analytics...
            </div>
          ) : (
            <>
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
                  <div className="metric-value">
                    {analyticsData.topCategory.name === 'N/A' ? 'N/A' : formatCurrency(analyticsData.topCategory.value).formattedWithSymbol}
                  </div>
                  {analyticsData.topCategory.name !== 'N/A' && (
                    <div className="metric-subtitle">{analyticsData.topCategory.name}</div>
                  )}
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
                  <div className="metric-value income">
                    {formatCurrency(analyticsData.totalIncome).formattedWithSymbol}
                  </div>
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
                  <div className="metric-value expense">
                    {formatCurrency(analyticsData.totalExpense).formattedWithSymbol}
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Income vs Expense</h3>
                  <div className="chart-container">
                    {analyticsData.barChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                            formatter={(value) => formatCurrency(Number(value)).formattedWithSymbol}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="square"
                          />
                          <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        No transaction data available for this year
                      </div>
                    )}
                  </div>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Spending by Category</h3>
                  <div className="chart-container">
                    {analyticsData.pieChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData.pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, value }) => `${name}: ${formatCurrency(value).formattedWithSymbol}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsData.pieChartData.map((entry, index) => (
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
                            formatter={(value) => formatCurrency(Number(value)).formattedWithSymbol}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        No expense categories found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="summary-card">
                <h3 className="chart-title">Summary</h3>
                <div className="summary-metrics">
                  <div className="summary-metric">
                    <span className="summary-label">Savings Rate</span>
                    <span className={`summary-value ${analyticsData.savingsRate >= 0 ? 'income' : 'expense'}`}>
                      {analyticsData.savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="summary-metric">
                    <span className="summary-label">Average Monthly Expense</span>
                    <span className="summary-value expense">
                      {formatCurrency(analyticsData.avgMonthlyExpense).formattedWithSymbol}
                    </span>
                  </div>
                  <div className="summary-metric">
                    <span className="summary-label">Average Monthly Income</span>
                    <span className="summary-value income">
                      {formatCurrency(analyticsData.avgMonthlyIncome).formattedWithSymbol}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
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
