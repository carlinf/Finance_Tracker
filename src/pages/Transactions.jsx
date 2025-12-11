import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { signOutUser } from '../firebase/auth'
import { subscribeToTransactions, deleteTransaction, addTransaction, subscribeToCategories, updateTransaction } from '../firebase/firestore'
import { Timestamp } from 'firebase/firestore'
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState(null)
  const [deletingTransactionId, setDeletingTransactionId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(false)
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
    })

    return () => unsubscribe()
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
  const uniqueCategories = useMemo(() => {
    const unique = [...new Set(transactions.map(t => t.category).filter(Boolean))]
    return unique.sort()
  }, [transactions])

  // Format transaction date
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  // Format date for CSV export
  const formatDateForCSV = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  // Export transactions to CSV/Excel
  const handleExportToCSV = () => {
    // Use filtered transactions or all transactions
    const transactionsToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions

    if (transactionsToExport.length === 0) {
      alert('No transactions to export')
      return
    }

    // CSV Headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Balance']
    
    // Calculate running balance
    let balance = 0
    const rows = transactionsToExport
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0)
        const dateB = b.createdAt?.toDate() || new Date(0)
        return dateA - dateB
      })
      .map(transaction => {
        balance += transaction.amount || 0
        const isIncome = (transaction.amount || 0) > 0
        const type = isIncome ? 'Income' : 'Expense'
        const amount = Math.abs(transaction.amount || 0)
        
        return [
          formatDateForCSV(transaction.createdAt || transaction.date),
          transaction.name || transaction.description || 'Unnamed Transaction',
          transaction.category || 'Uncategorized',
          type,
          amount.toFixed(2),
          balance.toFixed(2)
        ]
      })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellValue = String(cell || '')
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          return `"${cellValue.replace(/"/g, '""')}"`
        }
        return cellValue
      }).join(','))
    ].join('\n')

    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Generate filename with current date
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    link.setAttribute('download', `transactions_${today}.csv`)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
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

  const handleDeleteTransaction = (transactionId) => {
    setDeletingTransactionId(transactionId)
    setShowDeleteTransactionModal(true)
  }

  const confirmDeleteTransaction = async () => {
    if (!deletingTransactionId) return

    setDeleting(true)

    try {
      const { error } = await deleteTransaction(deletingTransactionId)
      if (error) {
        alert('Failed to delete transaction: ' + error)
        setDeleting(false)
      } else {
        // Successfully deleted from Firebase
        setShowDeleteTransactionModal(false)
        setDeletingTransactionId(null)
        setDeleting(false)
        // Transaction will be automatically removed from the list via the subscription
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Failed to delete transaction: ' + error.message)
      setDeleting(false)
    }
  }

  const cancelDeleteTransaction = () => {
    setShowDeleteTransactionModal(false)
    setDeletingTransactionId(null)
  }

  const handleEditTransaction = (transaction) => {
    // Determine type from amount
    const isIncome = (transaction.amount || 0) > 0
    const type = isIncome ? 'income' : 'expense'
    
    // Format date
    let formattedDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    if (transaction.createdAt) {
      const date = transaction.createdAt.toDate ? transaction.createdAt.toDate() : new Date(transaction.createdAt)
      formattedDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    } else if (transaction.date) {
      const date = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date)
      formattedDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    }

    setEditingTransactionId(transaction.id)
    setTransactionForm({
      type: type,
      amount: Math.abs(transaction.amount || 0).toString(),
      category: transaction.category || '',
      date: formattedDate,
      description: transaction.name || transaction.description || '',
      receipt: null
    })
    setFormErrors({})
    setShowEditTransactionModal(true)
  }

  const handleCloseEditTransaction = () => {
    setShowEditTransactionModal(false)
    setEditingTransactionId(null)
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

  const handleUpdateTransaction = async (e) => {
    e.preventDefault()
    setUpdating(true)
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
      setUpdating(false)
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

      const { error } = await updateTransaction(editingTransactionId, transactionData)
      
      if (error) {
        alert('Failed to update transaction: ' + error)
      } else {
        handleCloseEditTransaction()
      }
    } catch (error) {
      alert('Failed to update transaction: ' + error.message)
    } finally {
      setUpdating(false)
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

        <div className="page-header-section">
          <div>
            <p className="page-subtitle">View and manage all your financial transactions</p>
          </div>
          <div className="header-actions">
            <button className="btn-export" onClick={handleExportToCSV}>
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
              <div className="card-amount income">{formatCurrency(totalIncome)}</div>
            </div>

            <div className="summary-card expense-card">
              <div className="card-header">
                <span className="card-title">Total Expense</span>
                <span className="card-badge expense-badge">{expenseCount}</span>
              </div>
              <div className="card-amount expense">{formatCurrency(totalExpense)}</div>
            </div>

            <div className="summary-card balance-card">
              <div className="card-header">
                <span className="card-title">Net Balance</span>
                <span className="card-badge neutral-badge">{transactions.length} total</span>
              </div>
              <div className={`card-amount ${netBalance >= 0 ? 'income' : 'expense'}`}>
                {formatCurrency(netBalance)}
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
                {uniqueCategories.map(category => (
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
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount || 0))}
                      </div>
                      <span className={`transaction-badge ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? 'income' : 'expense'}
                      </span>
                    </div>
                    <div className="transaction-actions">
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleEditTransaction(transaction)}
                        title="Edit transaction"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        title="Delete transaction"
                        disabled={deleting && deletingTransactionId === transaction.id}
                      >
                        {deleting && deletingTransactionId === transaction.id ? (
                          <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                          </svg>
                        )}
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

      {/* Edit Transaction Modal */}
      {showEditTransactionModal && (
        <div className="modal-overlay" onClick={handleCloseEditTransaction}>
          <div className="add-transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-transaction-header">
              <div>
                <h2 className="add-transaction-title">Edit Transaction</h2>
                <p className="add-transaction-subtitle">Update transaction details.</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseEditTransaction}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction} className="add-transaction-form">
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
                    id="receipt-upload-edit"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="receipt-upload-edit" className="file-upload-label">
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
                  onClick={handleCloseEditTransaction}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn form-btn-submit"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {showDeleteTransactionModal && (
        <div className="modal-overlay" onClick={cancelDeleteTransaction}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Transaction?</h2>
            <p className="modal-message">
              Are you sure you want to delete this transaction? This action cannot be undone and will permanently remove the transaction from your records.
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={cancelDeleteTransaction}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-confirm" 
                onClick={confirmDeleteTransaction}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions

