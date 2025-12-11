import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOutUser } from '../firebase/auth'
import { subscribeToCategories, addCategory, deleteCategory, updateCategory } from '../firebase/firestore'
import './Categories.css'

function Categories() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#10b981'
  })
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Subscribe to categories from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    console.log('Subscribing to categories for user:', currentUser.uid)
    const unsubscribe = subscribeToCategories(currentUser.uid, (fetchedCategories) => {
      console.log('Received categories:', fetchedCategories.length, fetchedCategories)
      setCategories(fetchedCategories)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Separate categories by type
  const categoriesByType = useMemo(() => {
    const income = categories.filter(cat => cat.type === 'income')
    const expense = categories.filter(cat => cat.type === 'expense')
    return { income, expense }
  }, [categories])

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

  const handleEdit = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (category) {
      setEditingCategoryId(categoryId)
      setFormData({
        name: category.name || category.category || '',
        type: category.type || 'expense',
        color: category.color || '#10b981'
      })
      setShowEditCategoryModal(true)
    }
  }

  const handleCloseEditCategory = () => {
    setShowEditCategoryModal(false)
    setEditingCategoryId(null)
    setFormData({
      name: '',
      type: 'expense',
      color: '#10b981'
    })
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a category name')
      return
    }

    if (!currentUser) {
      alert('You must be logged in to update a category')
      return
    }

    setUpdating(true)

    try {
      const { error } = await updateCategory(editingCategoryId, {
        name: formData.name.trim(),
        type: formData.type,
        color: formData.color
      })
      
      if (error) {
        alert('Failed to update category: ' + error)
      } else {
        handleCloseEditCategory()
      }
    } catch (error) {
      alert('Failed to update category: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = (categoryId) => {
    setDeletingCategoryId(categoryId)
    setShowDeleteCategoryModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCategoryId) return

    setDeleting(true)

    try {
      const { error } = await deleteCategory(deletingCategoryId)
      if (error) {
        alert('Failed to delete category: ' + error)
      } else {
        setShowDeleteCategoryModal(false)
        setDeletingCategoryId(null)
      }
      // Category will be automatically removed from the list via the subscription
    } catch (error) {
      alert('Failed to delete category: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteCategoryModal(false)
    setDeletingCategoryId(null)
  }

  const handleOpenAddCategory = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#10b981'
    })
    setShowAddCategoryModal(true)
  }

  const handleCloseAddCategory = () => {
    setShowAddCategoryModal(false)
    setFormData({
      name: '',
      type: 'expense',
      color: '#10b981'
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitCategory = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a category name')
      return
    }

    if (!currentUser) {
      alert('You must be logged in to add a category')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await addCategory(currentUser.uid, {
        name: formData.name.trim(),
        type: formData.type,
        color: formData.color
      })
      
      if (error) {
        alert('Failed to add category: ' + error)
      } else {
        handleCloseAddCategory()
      }
    } catch (error) {
      alert('Failed to add category: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const colorOptions = [
    { value: '#10b981', label: 'Green', name: 'green' },
    { value: '#3b82f6', label: 'Blue', name: 'blue' },
    { value: '#ef4444', label: 'Red', name: 'red' },
    { value: '#f59e0b', label: 'Orange', name: 'orange' },
    { value: '#8b5cf6', label: 'Purple', name: 'purple' },
    { value: '#ec4899', label: 'Pink', name: 'pink' },
    { value: '#06b6d4', label: 'Cyan', name: 'cyan' },
    { value: '#6b7280', label: 'Gray', name: 'gray' }
  ]

  return (
    <div className="categories-container">
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
          <Link to="/categories" className="nav-item active" onClick={() => setIsMenuOpen(false)}>
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

      <main className="categories-main">
        <header className="categories-header">
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="page-title">Categories</h1>
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

        <div className="categories-content">
          <div className="categories-page-header">
            <div className="page-header-left">
              <h2 className="categories-page-title">Categories</h2>
              <p className="categories-page-subtitle">Manage your transaction categories</p>
            </div>
            <button className="btn-add-category" onClick={handleOpenAddCategory}>
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
                  Income Categories <span className="category-count income">({categoriesByType.income.length})</span>
                </h3>
              </div>
              <div className="category-list">
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    Loading categories...
                  </div>
                ) : categoriesByType.income.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    No income categories yet. Add your first category!
                  </div>
                ) : (
                  categoriesByType.income.map((category) => (
                  <div key={category.id} className="category-item">
                    <div className="category-item-left">
                      <div 
                        className="category-dot" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="category-name">{category.name || category.category || 'Unnamed Category'}</span>
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
                        disabled={deleting && deletingCategoryId === category.id}
                      >
                        {deleting && deletingCategoryId === category.id ? (
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
                  ))
                )}
              </div>
            </div>

            <div className="category-card">
              <div className="category-card-header">
                <svg className="category-type-icon expense" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <h3 className="category-card-title">
                  Expense Categories <span className="category-count expense">({categoriesByType.expense.length})</span>
                </h3>
              </div>
              <div className="category-list">
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    Loading categories...
                  </div>
                ) : categoriesByType.expense.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    No expense categories yet. Add your first category!
                  </div>
                ) : (
                  categoriesByType.expense.map((category) => (
                  <div key={category.id} className="category-item">
                    <div className="category-item-left">
                      <div 
                        className="category-dot" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="category-name">{category.name || category.category || 'Unnamed Category'}</span>
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
                        disabled={deleting && deletingCategoryId === category.id}
                      >
                        {deleting && deletingCategoryId === category.id ? (
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
                  ))
                )}
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

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay" onClick={handleCloseAddCategory}>
          <div className="add-category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-category-header">
              <h2 className="add-category-title">Add New Category</h2>
              <button className="modal-close-btn" onClick={handleCloseAddCategory}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="add-category-form">
              {/* Name Field */}
              <div className="form-field">
                <label className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Category name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Type Field */}
              <div className="form-field">
                <label className="form-label">
                  Type <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    name="type"
                    className="form-select"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Color Field */}
              <div className="form-field">
                <label className="form-label">
                  Color <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    name="color"
                    className="form-select"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <div className="color-preview" style={{ backgroundColor: formData.color }}></div>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="form-btn form-btn-cancel"
                  onClick={handleCloseAddCategory}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn form-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="modal-overlay" onClick={handleCloseEditCategory}>
          <div className="add-category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-category-header">
              <h2 className="add-category-title">Edit Category</h2>
              <button className="modal-close-btn" onClick={handleCloseEditCategory}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="add-category-form">
              {/* Name Field */}
              <div className="form-field">
                <label className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Category name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Type Field */}
              <div className="form-field">
                <label className="form-label">
                  Type <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    name="type"
                    className="form-select"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Color Field */}
              <div className="form-field">
                <label className="form-label">
                  Color <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    name="color"
                    className="form-select"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <div className="color-preview" style={{ backgroundColor: formData.color }}></div>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="form-btn form-btn-cancel"
                  onClick={handleCloseEditCategory}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn form-btn-submit"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Category?</h2>
            <p className="modal-message">
              Are you sure you want to delete this category? This action cannot be undone and will remove the category from all associated transactions.
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-confirm" 
                onClick={confirmDelete}
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

export default Categories
