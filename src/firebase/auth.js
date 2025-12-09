import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from './config'

// Sign up with email and password
export const signUpWithEmail = async (email, password, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // Update user profile with display name
    if (fullName) {
      await updateProfile(userCredential.user, {
        displayName: fullName
      })
    }
    return { user: userCredential.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    return { user: userCredential.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser
}

// Update password
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser
    
    if (!user || !user.email) {
      return { error: 'No user is currently signed in' }
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    
    // Update password
    await updatePassword(user, newPassword)
    
    return { error: null }
  } catch (error) {
    let errorMessage = error.message
    
    // Provide user-friendly error messages
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak. Please use at least 6 characters'
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please sign out and sign in again before changing your password'
    }
    
    return { error: errorMessage }
  }
}

// Delete user account
export const deleteUserAccount = async () => {
  try {
    const user = auth.currentUser
    
    if (!user) {
      return { error: 'No user is currently signed in' }
    }

    // Delete the user account from Firebase Authentication
    await deleteUser(user)
    
    return { error: null }
  } catch (error) {
    let errorMessage = error.message
    
    // Provide user-friendly error messages
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please sign out and sign in again before deleting your account'
    }
    
    return { error: errorMessage }
  }
}

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}
