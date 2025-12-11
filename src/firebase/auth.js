import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
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

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Update user profile (display name)
export const updateUserProfile = async (displayName) => {
  try {
    if (!auth.currentUser) {
      return { error: 'No user logged in' }
    }
    await updateProfile(auth.currentUser, {
      displayName: displayName
    })
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Update user email
export const updateUserEmail = async (newEmail) => {
  try {
    if (!auth.currentUser) {
      return { error: 'No user logged in' }
    }
    await updateEmail(auth.currentUser, newEmail)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Update user password
export const updateUserPassword = async (newPassword) => {
  try {
    if (!auth.currentUser) {
      return { error: 'No user logged in' }
    }
    await updatePassword(auth.currentUser, newPassword)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Re-authenticate user (required before sensitive operations)
export const reauthenticateUser = async (password) => {
  try {
    if (!auth.currentUser || !auth.currentUser.email) {
      return { error: 'No user logged in' }
    }
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    )
    await reauthenticateWithCredential(auth.currentUser, credential)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Delete user account
export const deleteUserAccount = async (password) => {
  try {
    if (!auth.currentUser) {
      return { error: 'No user logged in' }
    }

    // Re-authenticate before deletion (Firebase requirement)
    if (password && auth.currentUser.email) {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      )
      await reauthenticateWithCredential(auth.currentUser, credential)
    }

    // Delete the user account
    await deleteUser(auth.currentUser)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}
