import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Categories.css'

function Categories() {
  const navigate = useNavigate()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  
  const [categories] = useState({
    income: [
      { id: 1, name: 'Salary', color: '#10b981' },
      { id: 2, name: 'Freelance', color: '#3b82f6' }
    ],
    expense: [
      { id: 3, name: 'Food', color: '#ef4444' },
      { id: 4, name: 'Entertainment', color: '#6b7280' },
      { id: 5, name: 'Transportation', color: '#ef4444' },
      { id: 6, name: 'Utilities', color: '#6b7280' }
    ]
  })

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

  const handleEdit = (categoryId) => {
    // Handle edit functionality
    console.log('Edit category:', categoryId)
  }

  const handleDelete = (categoryId) => {
    // Handle delete functionality
    console.log('Delete category:', categoryId)
  }

  return (
    <div className="categories-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Finance</h2>
          <p className="sidebar-subtitle">Personal Tracker</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
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
          <Link to="/categories" className="nav-item active">
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

      <main className="categories-main">
        <header className="categories-header">
          <h1 className="page-title">Categories</h1>
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

        <div className="categories-content">
          <div className="categories-page-header">
            <div className="page-header-left">
              <h2 className="categories-page-title">Categories</h2>
              <p className="categories-page-subtitle">Manage your transaction categories</p>
            </div>
            <button className="btn-add-category">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Add Category
            </button>
          </div>

          <div className="categories-grid">
            <div className="category-card">
              <div className="category-card-header">
                <svg className="category-type-icon income" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <h3 className="category-card-title">
                  Income Categories <span className="category-count income">({categories.income.length})</span>
                </h3>
              </div>
              <div className="category-list">
                {categories.income.map((category) => (
                  <div key={category.id} className="category-item">
                    <div className="category-item-left">
                      <div 
                        className="category-dot" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <div className="category-item-right">
                      <span className="category-tag income">Income</span>
                      <button 
                        className="category-action-btn"
                        onClick={() => handleEdit(category.id)}
                        aria-label="Edit category"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="category-action-btn"
                        onClick={() => handleDelete(category.id)}
                        aria-label="Delete category"
                      >
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

            <div className="category-card">
              <div className="category-card-header">
                <svg className="category-type-icon expense" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <h3 className="category-card-title">
                  Expense Categories <span className="category-count expense">({categories.expense.length})</span>
                </h3>
              </div>
              <div className="category-list">
                {categories.expense.map((category) => (
                  <div key={category.id} className="category-item">
                    <div className="category-item-left">
                      <div 
                        className="category-dot" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <div className="category-item-right">
                      <span className="category-tag expense">Expense</span>
                      <button 
                        className="category-action-btn"
                        onClick={() => handleEdit(category.id)}
                        aria-label="Edit category"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="category-action-btn"
                        onClick={() => handleDelete(category.id)}
                        aria-label="Delete category"
                      >
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

export default Categories
