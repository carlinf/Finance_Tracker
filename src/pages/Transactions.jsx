import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Transactions.css'

function Transactions() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const transactions = [
    {
      id: 1,
      name: 'Monthly Salary',
      category: 'Salary',
      amount: 5000.00,
      type: 'income',
      date: '02/12/2025'
    },
    {
      id: 2,
      name: 'Coffee Shop',
      category: 'Food',
      amount: -4.50,
      type: 'expense',
      date: '03/12/2025'
    },
    {
      id: 3,
      name: 'Grocery Store',
      category: 'Food',
      amount: -89.32,
      type: 'expense',
      date: '04/12/2025'
    },
    {
      id: 4,
      name: 'Netflix Subscription',
      category: 'Entertainment',
      amount: -15.99,
      type: 'expense',
      date: '04/12/2025'
    },
    {
      id: 5,
      name: 'Freelance Project',
      category: 'Freelance',
      amount: 1200.00,
      type: 'income',
      date: '29/11/2025'
    },
    {
      id: 6,
      name: 'Gas Station',
      category: 'Transport',
      amount: -45.00,
      type: 'expense',
      date: '28/11/2025'
    }
  ]

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = Math.abs(transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0))
  
  const netBalance = totalIncome - totalExpense

  const incomeCount = transactions.filter(t => t.type === 'income').length
  const expenseCount = transactions.filter(t => t.type === 'expense').length

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

  const handleClearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
  }

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

        <div className="page-header-section">
          <div>
            <p className="page-subtitle">View and manage all your financial transactions</p>
          </div>
          <div className="header-actions">
            <button className="btn-export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export CSV
            </button>
            <button className="btn-add-transaction">
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
              <div className="card-amount income">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div className="summary-card expense-card">
              <div className="card-header">
                <span className="card-title">Total Expense</span>
                <span className="card-badge expense-badge">{expenseCount}</span>
              </div>
              <div className="card-amount expense">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div className="summary-card balance-card">
              <div className="card-header">
                <span className="card-title">Net Balance</span>
                <span className="card-badge neutral-badge">{transactions.length} total</span>
              </div>
              <div className={`card-amount ${netBalance >= 0 ? 'income' : 'expense'}`}>
                ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <option value="Salary">Salary</option>
                <option value="Food">Food</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Freelance">Freelance</option>
                <option value="Transport">Transport</option>
              </select>
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className={`transaction-dot ${transaction.type}`}></div>
                <div className="transaction-info">
                  <div className="transaction-name">{transaction.name}</div>
                  <div className="transaction-meta">
                    {transaction.category} {transaction.date}
                  </div>
                </div>
                <div className="transaction-amount-wrapper">
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`transaction-badge ${transaction.type}`}>
                    {transaction.type}
                  </span>
                </div>
                <div className="transaction-actions">
                  <button className="action-btn edit-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="action-btn delete-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
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

export default Transactions

