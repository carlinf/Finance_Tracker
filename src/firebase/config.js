import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// Replace these values with your Firebase project config
// You can find these in Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
}

// Debug: Check if environment variables are loaded
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID
  })
}

// Validate Firebase config
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key" ||
    !firebaseConfig.projectId || firebaseConfig.projectId === "your-project-id") {
  console.error('⚠️ Firebase configuration is missing or incomplete!')
  console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set.')
}

// Initialize Firebase
let app
try {
  app = initializeApp(firebaseConfig)
  console.log('✅ Firebase initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  throw error
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

export default app
