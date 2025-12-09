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
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId))
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Get all transactions for a user
export const getTransactions = async (userId) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const transactions = []
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() })
    })
    
    // Sort manually by createdAt descending
    transactions.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0))
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0))
      return dateB - dateA // Descending order
    })
    
    return { transactions, error: null }
  } catch (error) {
    return { transactions: [], error: error.message }
  }
}

// Subscribe to real-time updates for transactions
export const subscribeToTransactions = (userId, callback) => {
  // Query without orderBy to avoid index requirement - we'll sort manually
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId)
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const transactions = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      transactions.push({ 
        id: doc.id, 
        ...data,
        // Ensure createdAt is properly handled
        createdAt: data.createdAt || Timestamp.now()
      })
    })
    
    // Sort manually by createdAt descending (newest first)
    transactions.sort((a, b) => {
      let dateA, dateB
      
      // Handle Firestore Timestamp
      if (a.createdAt?.toDate) {
        dateA = a.createdAt.toDate()
      } else if (a.createdAt) {
        dateA = new Date(a.createdAt)
      } else {
        dateA = new Date(0)
      }
      
      if (b.createdAt?.toDate) {
        dateB = b.createdAt.toDate()
      } else if (b.createdAt) {
        dateB = new Date(b.createdAt)
      } else {
        dateB = new Date(0)
      }
      
      return dateB - dateA // Descending order (newest first)
    })
    
    console.log('Transactions loaded:', transactions.length)
    callback(transactions)
  }, (error) => {
    console.error('Error subscribing to transactions:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    alert('Error loading transactions: ' + error.message + '\n\nPlease check:\n1. Firestore security rules are deployed\n2. You are authenticated\n3. Browser console for details')
    callback([])
  })
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
    console.log('Categories loaded:', categories.length)
    callback(categories)
  }, (error) => {
    console.error('Error subscribing to categories:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    alert('Error loading categories: ' + error.message + '\n\nPlease check:\n1. Firestore security rules are deployed\n2. You are authenticated\n3. Browser console for details')
    callback([])
  })
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

// Delete all user data (transactions, categories, and user profile)
export const deleteAllUserData = async (userId) => {
  try {
    const errors = []

    // Delete all transactions
    try {
      const transactionsQuery = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId)
      )
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const deleteTransactionPromises = transactionsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      await Promise.all(deleteTransactionPromises)
    } catch (error) {
      errors.push(`Failed to delete transactions: ${error.message}`)
    }

    // Delete all categories
    try {
      const categoriesQuery = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId)
      )
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const deleteCategoryPromises = categoriesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      await Promise.all(deleteCategoryPromises)
    } catch (error) {
      errors.push(`Failed to delete categories: ${error.message}`)
    }

    // Delete user profile
    try {
      const userProfileQuery = query(
        collection(db, USERS_COLLECTION),
        where('userId', '==', userId),
        limit(1)
      )
      const userProfileSnapshot = await getDocs(userProfileQuery)
      if (!userProfileSnapshot.empty) {
        const deleteProfilePromises = userProfileSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        )
        await Promise.all(deleteProfilePromises)
      }
    } catch (error) {
      errors.push(`Failed to delete user profile: ${error.message}`)
    }

    if (errors.length > 0) {
      return { error: errors.join('; ') }
    }

    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}