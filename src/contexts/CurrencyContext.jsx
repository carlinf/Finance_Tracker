import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile } from '../firebase/firestore'
import { formatCurrency as formatCurrencyUtil } from '../utils/currency'

const CurrencyContext = createContext()

export const CurrencyProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)

  // Load currency from user profile when user is available
  useEffect(() => {
    if (currentUser) {
      setLoading(true)
      getUserProfile(currentUser.uid).then(({ profile, error }) => {
        if (!error && profile && profile.currency) {
          setCurrency(profile.currency)
        }
        setLoading(false)
      })
    } else {
      // Default to USD when no user
      setCurrency('USD')
      setLoading(false)
    }
  }, [currentUser])

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency)
  }

  const value = {
    currency,
    updateCurrency,
    loading,
    formatCurrency: (amount) => formatCurrencyUtil(amount, currency)
  }

  return (
    <CurrencyContext.Provider value={value}>
      {!loading && children}
    </CurrencyContext.Provider>
  )
}

CurrencyProvider.displayName = 'CurrencyProvider'

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

