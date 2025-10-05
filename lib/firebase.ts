import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

// Configuración de Firebase (usando ControlFile)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_CONTROLFILE_API_KEY || "A",
  authDomain: process.env.NEXT_PUBLIC_CONTROLFILE_AUTH_DOMAIN || "c",
  projectId: process.env.NEXT_PUBLIC_CONTROLFILE_PROJECT_ID || "con",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_CONTROLFILE_APP_ID || "1:123456789:web:demo",
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  auth = getAuth(app)
  db = getFirestore(app)
  console.log('🔥 Firebase initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  // Create mock instances for development
  app = {} as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
}

export { auth, db }
