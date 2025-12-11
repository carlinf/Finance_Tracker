import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from './config'

// Transactions collection
const TRANSACTIONS_COLLECTION = 'transactions'
const CATEGORIES_COLLECTION = 'categories'
const USERS_COLLECTION = 'users'

// ============ TRANSACTIONS ============

// Add a new transaction
export const addTransaction = async (userId, transactionData) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...transactionData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    return { id: docRef.id, error: null }
  } catch (error) {
    return { id: null, error: error.message }
  }
}

// Update a transaction
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId)
    await updateDoc(transactionRef, {
      ...transactionData,
      updatedAt: Timestamp.now()
    })
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Delete a transaction
export const deleteTransaction = async (transactionId) => {
  try {
    if (!transactionId) {
      return { error: 'Transaction ID is required' }
    }
    
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId)
    await deleteDoc(transactionRef)
    
    console.log('Transaction deleted successfully from Firebase:', transactionId)
    return { error: null }
  } catch (error) {
    console.error('Error deleting transaction from Firebase:', error)
    return { error: error.message }
  }
}

// Get all transactions for a user
export const getTransactions = async (userId) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const transactions = []
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() })
    })
    return { transactions, error: null }
  } catch (error) {
    return { transactions: [], error: error.message }
  }
}

// Subscribe to real-time updates for transactions
export const subscribeToTransactions = (userId, callback) => {
  let unsubscribeFn = null
  let hasSwitchedToFallback = false
  
  // Try query with orderBy first (requires index)
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  unsubscribeFn = onSnapshot(q, (querySnapshot) => {
    const transactions = []
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() })
    })
    callback(transactions)
  }, (error) => {
    // Check if it's an index error and we haven't already switched to fallback
    if (error.code === 'failed-precondition' && error.message.includes('index') && !hasSwitchedToFallback) {
      hasSwitchedToFallback = true
      
      // Extract the index creation URL from the error if available
      let indexUrl = null
      if (error.message.includes('https://')) {
        const urlMatch = error.message.match(/https:\/\/[^\s]+/)
        if (urlMatch) {
          indexUrl = urlMatch[0]
        }
      }
      
      // Show instructions only once per session
      if (indexUrl && !sessionStorage.getItem('firestore-index-alert-shown')) {
        sessionStorage.setItem('firestore-index-alert-shown', 'true')
        console.log('❌ Firestore Index Required!')
        console.log('🔗 Create the index here:', indexUrl)
        console.log('📋 The app will use a fallback method until the index is created.')
        console.log('💡 Click the link above or copy this URL:', indexUrl)
      }
      
      // Fallback: Use query without orderBy and sort client-side
      console.log('⚠️ Using fallback query (works without index)')
      
      // Unsubscribe from the failed query
      if (unsubscribeFn) {
        unsubscribeFn()
      }
      
      const fallbackQuery = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId)
      )
      
      unsubscribeFn = onSnapshot(fallbackQuery, (querySnapshot) => {
        const transactions = []
        querySnapshot.forEach((doc) => {
          transactions.push({ id: doc.id, ...doc.data() })
        })
        // Sort client-side by createdAt descending
        transactions.sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0)
          const dateB = b.createdAt?.toDate() || new Date(0)
          return dateB - dateA // Descending order
        })
        callback(transactions)
      }, (fallbackError) => {
        console.error('Error in fallback query:', fallbackError)
        callback([])
      })
    } else if (!hasSwitchedToFallback) {
      // Only log non-index errors if we haven't switched to fallback
      console.error('Error subscribing to transactions:', error)
      callback([])
    }
    // If hasSwitchedToFallback is true, ignore subsequent errors from the original query
  })
  
  return () => {
    if (unsubscribeFn) {
      unsubscribeFn()
    }
  }
}

// ============ CATEGORIES ============

// Add a new category
export const addCategory = async (userId, categoryData) => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...categoryData,
      userId,
      createdAt: Timestamp.now()
    })
    return { id: docRef.id, error: null }
  } catch (error) {
    return { id: null, error: error.message }
  }
}

// Get all categories for a user
export const getCategories = async (userId) => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const categories = []
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() })
    })
    return { categories, error: null }
  } catch (error) {
    return { categories: [], error: error.message }
  }
}

// Update a category
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId)
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: Timestamp.now()
    })
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Delete a category
export const deleteCategory = async (categoryId) => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId))
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Subscribe to real-time updates for categories
export const subscribeToCategories = (userId, callback) => {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    where('userId', '==', userId)
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const categories = []
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() })
    })
    callback(categories)
  }, (error) => {
    console.error('Error subscribing to categories:', error)
    callback([])
  })
}

// ============ USER PROFILE ============

// Create or update user profile
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        userId,
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    } else {
      await updateDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.now()
      })
    }
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('userId', '==', userId),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { profile: { id: doc.id, ...doc.data() }, error: null }
    }
    return { profile: null, error: null }
  } catch (error) {
    return { profile: null, error: error.message }
  }
}

// Delete all user data from Firestore
export const deleteAllUserData = async (userId) => {
  try {
    // Delete all transactions
    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId)
    )
    const transactionsSnapshot = await getDocs(transactionsQuery)
    const deleteTransactionsPromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deleteTransactionsPromises)

    // Delete all categories
    const categoriesQuery = query(
      collection(db, CATEGORIES_COLLECTION),
      where('userId', '==', userId)
    )
    const categoriesSnapshot = await getDocs(categoriesQuery)
    const deleteCategoriesPromises = categoriesSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deleteCategoriesPromises)

    // Delete user profile
    const userProfileQuery = query(
      collection(db, USERS_COLLECTION),
      where('userId', '==', userId),
      limit(1)
    )
    const userProfileSnapshot = await getDocs(userProfileQuery)
    if (!userProfileSnapshot.empty) {
      await deleteDoc(userProfileSnapshot.docs[0].ref)
    }

    // Also try to delete by document ID (in case user profile uses userId as doc ID)
    try {
      const userRef = doc(db, USERS_COLLECTION, userId)
      await deleteDoc(userRef)
    } catch (error) {
      // Ignore if document doesn't exist
    }

    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}
