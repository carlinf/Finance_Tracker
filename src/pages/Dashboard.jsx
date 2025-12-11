import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { signOutUser } from '../firebase/auth'
import { subscribeToTransactions, addTransaction, subscribeToCategories } from '../firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { formatCurrency, getCurrencySymbol } = useCurrency()
  const [chartData, setChartData] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    description: '',
    receipt: null
  })
  const [formErrors, setFormErrors] = useState({})

  // Subscribe to categories from Firebase
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToCategories(currentUser.uid, (fetchedCategories) => {
      setCategories(fetchedCategories)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Subscribe to transactions from Firebase
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToTransactions(currentUser.uid, (fetchedTransactions) => {
      setTransactions(fetchedTransactions)
      setLoading(false)
      
      // Calculate chart data from transactions
      if (fetchedTransactions.length > 0) {
        // Group transactions by date and calculate running balance
        const sortedTransactions = [...fetchedTransactions].sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0)
          const dateB = b.createdAt?.toDate() || new Date(0)
          return dateA - dateB
        })
        
        let balance = 0
        const chartPoints = []
        const dateMap = new Map()
        
        sortedTransactions.forEach(transaction => {
          balance += transaction.amount || 0
          const date = transaction.createdAt?.toDate() || new Date()
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, balance)
          } else {
            dateMap.set(dateKey, balance)
          }
        })
        
        // Convert to array and add today's balance
        const chartDataArray = Array.from(dateMap.entries()).map(([date, balance]) => ({
          date,
          balance: Math.round(balance * 100) / 100
        }))
        
        // Add today's point if we have transactions
        if (chartDataArray.length > 0) {
          chartDataArray.push({
            date: 'Today',
            balance: Math.round(balance * 100) / 100
          })
        }
        
        // Limit to last 7 points for readability
        const limitedData = chartDataArray.slice(-7)
        setChartData(limitedData)
      } else {
        // Default empty state
        setChartData([{ date: 'Today', balance: 0 }])
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  // Calculate totals from transactions
  const totalBalance = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyIncome = transactions
    .filter(t => {
      const date = t.createdAt?.toDate() || new Date(0)
      return (t.amount || 0) > 0 && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const monthlyExpense = Math.abs(transactions
    .filter(t => {
      const date = t.createdAt?.toDate() || new Date(0)
      return (t.amount || 0) < 0 && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0))

  // Format transaction date
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get transaction icon based on category
  const getTransactionIcon = (category) => {
    const icons = {
      'Salary': '📈',
      'Food': '🍽️',
      'Entertainment': '📺',
      'Freelance': '💼',
      'Transport': '⛽',
      'Shopping': '🛒',
      'Coffee': '☕'
    }
    return icons[category] || '💰'
  }

  const handleSignOut = () => {
    setShowSignOutModal(true)
    setIsProfileDropdownOpen(false)
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

  const handleOpenAddTransaction = () => {
    setShowAddTransactionModal(true)
    setTransactionForm({
      type: 'expense',
      amount: '',
      category: '',
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      description: '',
      receipt: null
    })
    setFormErrors({})
  }

  const handleCloseAddTransaction = () => {
    setShowAddTransactionModal(false)
    setTransactionForm({
      type: 'expense',
      amount: '',
      category: '',
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      description: '',
      receipt: null
    })
    setFormErrors({})
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTransactionForm(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setTransactionForm(prev => ({
        ...prev,
        receipt: file
      }))
    }
  }

  const formatDateForInput = (dateString) => {
    // Convert MM/DD/YYYY to YYYY-MM-DD for input
    const parts = dateString.split('/')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
    }
    return dateString
  }

  const formatDateFromInput = (dateString) => {
    // Convert YYYY-MM-DD to MM/DD/YYYY
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  const handleDateChange = (e) => {
    const inputValue = e.target.value
    const formattedDate = formatDateFromInput(inputValue)
    setTransactionForm(prev => ({
      ...prev,
      date: formattedDate
    }))
  }

  const handleSubmitTransaction = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormErrors({})

    // Validation
    const errors = {}
    if (!transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
      errors.amount = 'Please enter a valid amount'
    }
    if (!transactionForm.category) {
      errors.category = 'Please select a category'
    }
    if (!transactionForm.date) {
      errors.date = 'Please select a date'
    }
    if (!transactionForm.description || transactionForm.description.trim() === '') {
      errors.description = 'Please enter a description'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setSubmitting(false)
      return
    }

    try {
      // Parse date and convert to Firestore Timestamp
      const dateParts = transactionForm.date.split('/')
      const transactionDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]))
      
      // Calculate amount: negative for expenses, positive for income
      const amount = transactionForm.type === 'expense' 
        ? -Math.abs(parseFloat(transactionForm.amount))
        : Math.abs(parseFloat(transactionForm.amount))

      const transactionData = {
        name: transactionForm.description,
        description: transactionForm.description,
        amount: amount,
        category: transactionForm.category,
        type: transactionForm.type,
        date: Timestamp.fromDate(transactionDate)
      }

      const { error } = await addTransaction(currentUser.uid, transactionData)
      
      if (error) {
        alert('Failed to add transaction: ' + error)
      } else {
        handleCloseAddTransaction()
      }
    } catch (error) {
      alert('Failed to add transaction: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter categories by type
  const filteredCategories = categories.filter(cat => 
    cat.type === transactionForm.type || !cat.type
  )

  return (
    <div className="dashboard-container">
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
          <Link to="/dashboard" className="nav-item active" onClick={() => setIsMenuOpen(false)}>
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
          <Link to="/analytics" className="nav-item" onClick={() => setIsMenuOpen(false)}>
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

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="page-title">Dashboard</h1>
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

        <div className="dashboard-content">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">Total Balance</span>
                <span className="card-icon">{getCurrencySymbol()}</span>
              </div>
              <div className="card-amount">{formatCurrency(totalBalance)}</div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">This Month Income</span>
                <svg className="card-icon income" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div className="card-amount income">+{formatCurrency(monthlyIncome)}</div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <span className="card-title">This Month Expense</span>
                <svg className="card-icon expense" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
              </div>
              <div className="card-amount expense">-{formatCurrency(monthlyExpense)}</div>
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
              <button className="btn-add-transaction" onClick={handleOpenAddTransaction}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Transaction
              </button>
            </div>

            <div className="transactions-list">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No transactions yet. Add your first transaction to get started!
                </div>
              ) : (
                transactions.slice(0, 7).map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">{getTransactionIcon(transaction.category)}</div>
                    <div className="transaction-details">
                      <div className="transaction-name">{transaction.name || transaction.description || 'Unnamed Transaction'}</div>
                      <div className="transaction-category">{transaction.category || 'Uncategorized'}</div>
                    </div>
                    <div className={`transaction-amount ${(transaction.amount || 0) > 0 ? 'income' : 'expense'}`}>
                      {(transaction.amount || 0) > 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount || 0))}
                    </div>
                    <div className="transaction-date">{formatDate(transaction.createdAt)}</div>
                  </div>
                ))
              )}
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

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="modal-overlay" onClick={handleCloseAddTransaction}>
          <div className="add-transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-transaction-header">
              <div>
                <h2 className="add-transaction-title">Add Transaction</h2>
                <p className="add-transaction-subtitle">Record a new income or expense transaction.</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseAddTransaction}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="add-transaction-form">
              {/* Transaction Type Toggle */}
              <div className="form-field">
                <label className="form-label">Transaction Type</label>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-toggle-btn ${transactionForm.type === 'expense' ? 'active' : ''}`}
                    onClick={() => {
                      setTransactionForm(prev => ({ ...prev, type: 'expense', category: '' }))
                      setFormErrors(prev => ({ ...prev, category: '' }))
                    }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`type-toggle-btn ${transactionForm.type === 'income' ? 'active' : ''}`}
                    onClick={() => {
                      setTransactionForm(prev => ({ ...prev, type: 'income', category: '' }))
                      setFormErrors(prev => ({ ...prev, category: '' }))
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount Field */}
              <div className="form-field">
                <label className="form-label">
                  Amount <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  className={`form-input ${formErrors.amount ? 'error' : ''}`}
                  placeholder="$0.00"
                  value={transactionForm.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                />
                {formErrors.amount && <span className="error-message">{formErrors.amount}</span>}
              </div>

              {/* Category Field */}
              <div className="form-field">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    name="category"
                    className={`form-select ${formErrors.category ? 'error' : ''}`}
                    value={transactionForm.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.name || cat.category}>
                        {cat.name || cat.category}
                      </option>
                    ))}
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {formErrors.category && <span className="error-message">{formErrors.category}</span>}
              </div>

              {/* Date Field */}
              <div className="form-field">
                <label className="form-label">
                  Date <span className="required">*</span>
                </label>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    name="date"
                    className={`form-input ${formErrors.date ? 'error' : ''}`}
                    value={formatDateForInput(transactionForm.date)}
                    onChange={handleDateChange}
                    required
                  />
                  <svg className="date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                {formErrors.date && <span className="error-message">{formErrors.date}</span>}
              </div>

              {/* Description Field */}
              <div className="form-field">
                <label className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                  placeholder="e.g., Grocery shopping, Monthly rent..."
                  value={transactionForm.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>

              {/* Receipt Upload Field */}
              <div className="form-field">
                <label className="form-label">Receipt (Optional)</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="receipt-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="receipt-upload" className="file-upload-label">
                    {transactionForm.receipt ? (
                      <div className="file-uploaded">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span>{transactionForm.receipt.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTransactionForm(prev => ({ ...prev, receipt: null }))
                          }}
                          className="remove-file-btn"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span>Click to upload receipt image</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="form-btn form-btn-cancel"
                  onClick={handleCloseAddTransaction}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn form-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

