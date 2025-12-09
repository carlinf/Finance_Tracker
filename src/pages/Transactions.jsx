import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { signOutUser } from '../firebase/auth'
import { subscribeToTransactions, deleteTransaction, addTransaction, getCategories } from '../firebase/firestore'
import './Transactions.css'

function Transactions() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { formatCurrency } = useCurrency()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [userCategories, setUserCategories] = useState([])
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receipt: null
  })
  const [submitting, setSubmitting] = useState(false)

  // Subscribe to transactions from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    console.log('Subscribing to transactions for user:', currentUser.uid)
    const unsubscribe = subscribeToTransactions(currentUser.uid, (fetchedTransactions) => {
      console.log('Received transactions:', fetchedTransactions.length, fetchedTransactions)
      setTransactions(fetchedTransactions)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentUser) return
      const { categories: fetchedCategories } = await getCategories(currentUser.uid)
      setUserCategories(fetchedCategories)
    }
    fetchCategories()
  }, [currentUser])

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !searchQuery || 
        (transaction.name || transaction.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'income' && (transaction.amount || 0) > 0) ||
        (typeFilter === 'expense' && (transaction.amount || 0) < 0)
      
      const matchesCategory = categoryFilter === 'all' || 
        (transaction.category || '').toLowerCase() === categoryFilter.toLowerCase()
      
      return matchesSearch && matchesType && matchesCategory
    })
  }, [transactions, searchQuery, typeFilter, categoryFilter])

  // Calculate totals from filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => (t.amount || 0) > 0)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalExpense = Math.abs(filteredTransactions
    .filter(t => (t.amount || 0) < 0)
    .reduce((sum, t) => sum + (t.amount || 0), 0))
  
  const netBalance = totalIncome - totalExpense

  const incomeCount = filteredTransactions.filter(t => (t.amount || 0) > 0).length
  const expenseCount = filteredTransactions.filter(t => (t.amount || 0) < 0).length

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))]
    return uniqueCategories.sort()
  }, [transactions])

  // Format transaction date
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

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

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const { error } = await deleteTransaction(transactionId)
      if (error) {
        alert('Failed to delete transaction: ' + error)
      }
    }
  }

  const cancelSignOut = () => {
    setShowSignOutModal(false)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
  }

  const handleExportCSV = () => {
    // Use filtered transactions or all transactions
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions
    
    if (dataToExport.length === 0) {
      alert('No transactions to export.')
      return
    }

    // CSV headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    
    // Convert transactions to CSV rows
    const rows = dataToExport.map(transaction => {
      const date = formatDate(transaction.createdAt)
      const description = (transaction.name || transaction.description || 'N/A').replace(/"/g, '""') // Escape quotes
      const category = (transaction.category || 'Uncategorized').replace(/"/g, '""')
      const type = (transaction.amount || 0) > 0 ? 'Income' : 'Expense'
      const amount = Math.abs(transaction.amount || 0).toFixed(2)
      
      // Wrap fields in quotes if they contain commas
      return [
        `"${date}"`,
        `"${description}"`,
        `"${category}"`,
        `"${type}"`,
        `"${amount}"`
      ].join(',')
    })
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Generate filename with current date
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const filename = `transactions_${dateStr}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenAddTransaction = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receipt: null
    })
    setShowAddTransactionModal(true)
  }

  const handleCloseAddTransaction = () => {
    setShowAddTransactionModal(false)
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receipt: null
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      receipt: e.target.files[0] || null
    }))
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) {
      const today = new Date()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const year = today.getFullYear()
      return `${month}/${day}/${year}`
    }
    
    // Convert YYYY-MM-DD to MM/DD/YYYY for display
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-')
      return `${month}/${day}/${year}`
    }
    
    // If already in MM/DD/YYYY format, return as-is
    return dateString
  }

  const handleDateChange = (e) => {
    let value = e.target.value
    
    // Remove any non-digit characters except slashes
    value = value.replace(/[^\d/]/g, '')
    
    // Auto-format as user types: MM/DD/YYYY
    let formatted = value
    const numbers = value.replace(/\//g, '')
    
    if (numbers.length > 2 && numbers.length <= 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2)
    } else if (numbers.length > 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8)
    }
    
    // Convert MM/DD/YYYY to YYYY-MM-DD for storage
    const parts = formatted.split('/')
    if (parts.length === 3 && parts[0] && parts[1] && parts[2] && parts[2].length === 4) {
      const month = parts[0].padStart(2, '0')
      const day = parts[1].padStart(2, '0')
      const year = parts[2]
      
      // Validate the date
      const dateObj = new Date(`${year}-${month}-${day}`)
      if (!isNaN(dateObj.getTime())) {
        setFormData(prev => ({
          ...prev,
          date: `${year}-${month}-${day}`
        }))
        return
      }
    }
    
    // Store display format temporarily if not complete
    setFormData(prev => ({
      ...prev,
      date: formatted
    }))
  }

  const handleSubmitTransaction = async (e) => {
    e.preventDefault()
    
    if (!formData.amount || !formData.category || !formData.date || !formData.description) {
      alert('Please fill in all required fields')
      return
    }

    if (!currentUser) {
      alert('You must be logged in to add a transaction')
      return
    }

    setSubmitting(true)

    try {
      // Convert amount to number, negative for expenses, positive for income
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount')
        setSubmitting(false)
        return
      }
      const transactionAmount = formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)

      // Ensure date is in YYYY-MM-DD format
      let dateToStore = formData.date
      if (dateToStore.includes('/')) {
        const parts = dateToStore.split('/')
        if (parts.length === 3) {
          const [month, day, year] = parts
          dateToStore = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
      }

      const transactionData = {
        name: formData.description,
        description: formData.description,
        amount: transactionAmount,
        category: formData.category,
        date: dateToStore,
        type: formData.type
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

  // Default categories if none exist
  const defaultCategories = useMemo(() => {
    if (formData.type === 'income') {
      return [
        { id: 'default-salary', name: 'Salary', type: 'income' },
        { id: 'default-freelance', name: 'Freelance', type: 'income' },
        { id: 'default-investment', name: 'Investment', type: 'income' },
        { id: 'default-bonus', name: 'Bonus', type: 'income' },
        { id: 'default-other', name: 'Other Income', type: 'income' }
      ]
    } else {
      return [
        { id: 'default-food', name: 'Food', type: 'expense' },
        { id: 'default-transportation', name: 'Transportation', type: 'expense' },
        { id: 'default-entertainment', name: 'Entertainment', type: 'expense' },
        { id: 'default-utilities', name: 'Utilities', type: 'expense' },
        { id: 'default-shopping', name: 'Shopping', type: 'expense' },
        { id: 'default-healthcare', name: 'Healthcare', type: 'expense' },
        { id: 'default-other', name: 'Other Expense', type: 'expense' }
      ]
    }
  }, [formData.type])

  // Filter categories by type, or use defaults if none exist
  const filteredCategories = useMemo(() => {
    if (userCategories.length === 0) {
      return defaultCategories
    }
    
    return userCategories.filter(cat => {
      // If category has a type field, filter by it
      if (cat.type) {
        return cat.type === formData.type
      }
      // Otherwise, show all categories
      return true
    })
  }, [userCategories, formData.type, defaultCategories])

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
          <Link to="/dashboard" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </Link>
          <Link to="/transactions" className="nav-item active" onClick={() => setIsMenuOpen(false)}>
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
          <h1 className="page-title">Transactions</h1>
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

        <div className="page-header-section">
          <div>
            <p className="page-subtitle">View and manage all your financial transactions</p>
          </div>
          <div className="header-actions">
            <button className="btn-export" onClick={handleExportCSV}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export CSV
            </button>
            <button className="btn-add-transaction" onClick={handleOpenAddTransaction}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              + Add Transaction
            </button>
          </div>
        </div>

        <div className="transactions-content">
          <div className="summary-cards">
            <div className="summary-card income-card">
              <div className="card-header">
                <span className="card-title">Total Income</span>
                <span className="card-badge income-badge">+{incomeCount}</span>
              </div>
              <div className="card-amount income">{formatCurrency(totalIncome).formattedWithSymbol}</div>
            </div>

            <div className="summary-card expense-card">
              <div className="card-header">
                <span className="card-title">Total Expense</span>
                <span className="card-badge expense-badge">{expenseCount}</span>
              </div>
              <div className="card-amount expense">{formatCurrency(totalExpense).formattedWithSymbol}</div>
            </div>

            <div className="summary-card balance-card">
              <div className="card-header">
                <span className="card-title">Net Balance</span>
                <span className="card-badge neutral-badge">{transactions.length} total</span>
              </div>
              <div className={`card-amount ${netBalance >= 0 ? 'income' : 'expense'}`}>
                {formatCurrency(Math.abs(netBalance)).formattedWithSymbol}
              </div>
            </div>
          </div>

          <div className="filters-section">
            <div className="filters-header">
              <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <h3 className="filters-title">Filters</h3>
            </div>
            <div className="filters-content">
              <div className="search-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select 
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                {transactions.length === 0 
                  ? 'No transactions yet. Add your first transaction to get started!'
                  : 'No transactions match your filters.'}
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const isIncome = (transaction.amount || 0) > 0
                return (
                  <div key={transaction.id} className="transaction-card">
                    <div className={`transaction-dot ${isIncome ? 'income' : 'expense'}`}></div>
                    <div className="transaction-info">
                      <div className="transaction-name">{transaction.name || transaction.description || 'Unnamed Transaction'}</div>
                      <div className="transaction-meta">
                        {transaction.category || 'Uncategorized'} • {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                    <div className="transaction-amount-wrapper">
                      <div className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? '+' : ''}{formatCurrency(Math.abs(transaction.amount || 0)).formattedWithSymbol}
                      </div>
                      <span className={`transaction-badge ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? 'income' : 'expense'}
                      </span>
                    </div>
                    <div className="transaction-actions">
                      <button className="action-btn edit-btn" title="Edit transaction">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        title="Delete transaction"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
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
                <p className="add-transaction-subtitle">Record a new income or expense transaction</p>
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
              <div className="transaction-type-toggle">
                <button
                  type="button"
                  className={`type-toggle-btn ${formData.type === 'expense' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`type-toggle-btn ${formData.type === 'income' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                >
                  Income
                </button>
              </div>

              {/* Amount Field */}
              <div className="form-field">
                <label className="form-label">
                  Amount <span className="required">*</span>
                </label>
                <div className="amount-input-wrapper">
                  <span className="amount-prefix">{formatCurrency(0).symbol}</span>
                  <input
                    type="number"
                    name="amount"
                    className="form-input amount-input"
                    placeholder=" 0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Category Field */}
              <div className="form-field">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
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
              </div>

              {/* Date Field */}
              <div className="form-field">
                <label className="form-label">
                  Date <span className="required">*</span>
                </label>
                <div className="date-input-wrapper">
                  <input
                    type="text"
                    name="date"
                    className="form-input date-input"
                    placeholder="MM/DD/YYYY"
                    value={formatDateForInput(formData.date)}
                    onChange={handleDateChange}
                    required
                  />
                  <svg className="date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>

              {/* Description Field */}
              <div className="form-field">
                <label className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="e.g., Grocery shopping, Monthly rent..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>

              {/* Receipt Upload Field */}
              <div className="form-field">
                <label className="form-label">Receipt (Optional)</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="receipt-upload"
                    className="file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt-upload" className="file-upload-label">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Click to upload receipt image</span>
                    {formData.receipt && (
                      <span className="file-name">{formData.receipt.name}</span>
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

export default Transactions

