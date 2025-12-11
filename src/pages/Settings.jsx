import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { signOutUser, updateUserProfile, updateUserEmail, updateUserPassword, reauthenticateUser, deleteUserAccount } from '../firebase/auth'
import { deleteAllUserData } from '../firebase/firestore'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { currency, setCurrency } = useCurrency()
  const [activeTab, setActiveTab] = useState('profile')
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [profileErrors, setProfileErrors] = useState({})

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

  // Initialize form data with current user's data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.displayName || '',
        email: currentUser.email || ''
      })
    }
  }, [currentUser])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value
    })
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    setProfileErrors({})

    // Validation
    const errors = {}
    if (!formData.fullName.trim()) {
      errors.fullName = 'Please enter your full name'
    }
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      setSaving(false)
      return
    }

    try {
      // Update display name if changed
      if (formData.fullName !== currentUser?.displayName) {
        const { error: profileError } = await updateUserProfile(formData.fullName.trim())
        if (profileError) {
          alert('Failed to update name: ' + profileError)
          setSaving(false)
          return
        }
      }

      // Update email if changed
      if (formData.email !== currentUser?.email) {
        const { error: emailError } = await updateUserEmail(formData.email.trim())
        if (emailError) {
          alert('Failed to update email: ' + emailError)
          setSaving(false)
          return
        }
      }

      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChangePassword = () => {
    setShowChangePasswordModal(true)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordErrors({})
  }

  const handleCloseChangePassword = () => {
    setShowChangePasswordModal(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordErrors({})
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setChangingPassword(true)
    setPasswordErrors({})

    // Validation
    const errors = {}
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Please enter your current password'
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'Please enter a new password'
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters'
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      setChangingPassword(false)
      return
    }

    try {
      // Re-authenticate user first (required for password change)
      const { error: reauthError } = await reauthenticateUser(passwordData.currentPassword)
      if (reauthError) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' })
        setChangingPassword(false)
        return
      }

      // Update password
      const { error: updateError } = await updateUserPassword(passwordData.newPassword)
      if (updateError) {
        alert('Failed to update password: ' + updateError)
      } else {
        alert('Password updated successfully!')
        handleCloseChangePassword()
      }
    } catch (error) {
      alert('Failed to update password: ' + error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true)
  }

  const handleConfirmDeleteAccount = async () => {
    if (!currentUser) {
      alert('No user logged in')
      return
    }

    setDeletingAccount(true)

    try {
      // Delete all user data from Firestore first
      const { error: firestoreError } = await deleteAllUserData(currentUser.uid)
      if (firestoreError) {
        console.error('Error deleting user data:', firestoreError)
        // Continue with auth deletion even if Firestore deletion fails
      }

      // Delete user account from Firebase Authentication
      // Note: For email/password users, we need password for re-authentication
      // For Google users, we can delete directly
      const { error: authError } = await deleteUserAccount()
      
      if (authError) {
        alert('Failed to delete account: ' + authError)
        setDeletingAccount(false)
        return
      }

      // Account deleted successfully, redirect to login
      navigate('/login')
    } catch (error) {
      alert('Failed to delete account: ' + error.message)
      setDeletingAccount(false)
    }
  }

  const handleCancelDeleteAccount = () => {
    setShowDeleteAccountModal(false)
  }

  return (
    <div className="settings-container">
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
          <Link to="/analytics" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </Link>
          <Link to="/settings" className="nav-item active" onClick={() => setIsMenuOpen(false)}>
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

      <main className="settings-main">
        <header className="settings-header">
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="page-title">Settings</h1>
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

        <div className="settings-content">
          {/* Tab Navigation */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </button>
            <button
              className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
              </svg>
              Preferences
            </button>
            <button
              className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Account
            </button>
          </div>

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Profile Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className={`form-input ${profileErrors.fullName ? 'error' : ''}`}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                  {profileErrors.fullName && <span className="error-message">{profileErrors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${profileErrors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                  {profileErrors.email && <span className="error-message">{profileErrors.email}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-section">
                  <span className="password-description">Change your password</span>
                  <button 
                    type="button"
                    className="btn-change-password"
                    onClick={handleOpenChangePassword}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    Change Password
                  </button>
                </div>
              </div>
              <div className="form-actions-profile">
                <button
                  type="button"
                  className="form-btn form-btn-save"
                  onClick={handleUpdateProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab Content */}
          {activeTab === 'preferences' && (
            <div className="settings-card">
              <h2 className="settings-card-title">App Preferences</h2>
              <div className="form-group">
                <label htmlFor="currency" className="form-label">Currency</label>
                <div className="select-wrapper">
                  <select
                    id="currency"
                    className="form-select"
                    value={currency}
                    onChange={async (e) => {
                      const newCurrency = e.target.value
                      setSavingCurrency(true)
                      const { error } = await setCurrency(newCurrency)
                      if (error) {
                        alert('Failed to update currency: ' + error)
                      }
                      setSavingCurrency(false)
                    }}
                    disabled={savingCurrency}
                  >
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="JPY">Japanese Yen (JPY)</option>
                    <option value="INR">Indian Rupee (INR)</option>
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {savingCurrency && <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Saving...</span>}
              </div>
              <div className="toggle-section">
                <div className="toggle-content">
                  <svg className="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 01-3.46 0"></path>
                  </svg>
                  <div className="toggle-text">
                    <span className="toggle-label">Email Notifications</span>
                    <span className="toggle-description">Get notified about transactions</span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Account Tab Content */}
          {activeTab === 'account' && (
            <div className="settings-card danger-zone">
              <h2 className="settings-card-title danger-title">Danger Zone</h2>
              <div className="danger-content">
                <div className="danger-text">
                  <span className="danger-label">Delete Account</span>
                  <span className="danger-warning">This action cannot be undone</span>
                </div>
                <button className="btn-delete-account" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            </div>
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay" onClick={handleCloseChangePassword}>
          <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Change Password</h2>
              <button className="modal-close-btn" onClick={handleCloseChangePassword}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="change-password-form">
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Enter your current password"
                  required
                />
                {passwordErrors.currentPassword && (
                  <span className="error-message">{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                />
                {passwordErrors.newPassword && (
                  <span className="error-message">{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Confirm your new password"
                  required
                />
                {passwordErrors.confirmPassword && (
                  <span className="error-message">{passwordErrors.confirmPassword}</span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={handleCloseChangePassword}
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="modal-overlay" onClick={handleCancelDeleteAccount}>
          <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#dc2626' }}>Delete Account</h2>
              <button className="modal-close-btn" onClick={handleCancelDeleteAccount} disabled={deletingAccount}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="delete-account-modal-content">
              <p className="modal-message" style={{ marginBottom: '20px' }}>
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <p className="modal-message" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
                All your transactions, categories, and account data will be permanently deleted.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={handleCancelDeleteAccount}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-confirm"
                onClick={handleConfirmDeleteAccount}
                disabled={deletingAccount}
                style={{ background: '#ef4444', color: 'white' }}
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
