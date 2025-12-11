import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile, createUserProfile } from '../firebase/firestore'

const CurrencyContext = createContext()

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

// Currency symbols and formatting
const CURRENCY_INFO = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  INR: { symbol: '₹', locale: 'en-IN' }
}

export const CurrencyProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)

  // Load currency preference from Firebase
  useEffect(() => {
    const loadCurrency = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        const { profile, error } = await getUserProfile(currentUser.uid)
        if (error) {
          console.error('Error loading user profile:', error)
          setLoading(false)
          return
        }

        if (profile && profile.currency) {
          setCurrency(profile.currency)
        } else {
          // Set default currency and save to profile
          await createUserProfile(currentUser.uid, { currency: 'USD' })
        }
      } catch (error) {
        console.error('Error loading currency:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCurrency()
  }, [currentUser])

  // Update currency in Firebase
  const updateCurrency = async (newCurrency) => {
    if (!currentUser) return { error: 'No user logged in' }

    const previousCurrency = currency
    try {
      setCurrency(newCurrency)
      const { error } = await createUserProfile(currentUser.uid, { currency: newCurrency })
      if (error) {
        // Revert on error
        setCurrency(previousCurrency)
        return { error }
      }
      return { error: null }
    } catch (error) {
      // Revert on error
      setCurrency(previousCurrency)
      return { error: error.message }
    }
  }

  // Format currency value
  const formatCurrency = (amount) => {
    const info = CURRENCY_INFO[currency] || CURRENCY_INFO.USD
    const formatted = Math.abs(amount).toLocaleString(info.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `${info.symbol}${formatted}`
  }

  // Get currency symbol
  const getCurrencySymbol = () => {
    return CURRENCY_INFO[currency]?.symbol || '$'
  }

  const value = {
    currency,
    setCurrency: updateCurrency,
    formatCurrency,
    getCurrencySymbol,
    loading
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

