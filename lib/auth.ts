import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "./firebase"

const googleProvider = new GoogleAuthProvider()

// Verificar si Firebase Auth está configurado
const isFirebaseAuthConfigured = () => {
  return auth && typeof auth === 'object' && 'onAuthStateChanged' in auth
}

export async function signInWithGoogle() {
  if (!isFirebaseAuthConfigured()) {
    console.warn("Firebase Auth no está configurado. Usando modo mock.")
    throw new Error("Firebase Auth no está disponible en modo desarrollo")
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error("Error signing in with Google:", error)
    throw error
  }
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isFirebaseAuthConfigured()) {
    console.warn("Firebase Auth no está configurado. Usando modo mock.")
    throw new Error("Firebase Auth no está disponible en modo desarrollo")
  }
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error("Error signing up with email:", error)
    throw error
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!isFirebaseAuthConfigured()) {
    console.warn("Firebase Auth no está configurado. Usando modo mock.")
    throw new Error("Firebase Auth no está disponible en modo desarrollo")
  }
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error("Error signing in with email:", error)
    throw error
  }
}

export async function resetPassword(email: string) {
  if (!isFirebaseAuthConfigured()) {
    console.warn("Firebase Auth no está configurado. Usando modo mock.")
    throw new Error("Firebase Auth no está disponible en modo desarrollo")
  }
  
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw error
  }
}

export async function signOut() {
  if (!isFirebaseAuthConfigured()) {
    console.warn("Firebase Auth no está configurado. Usando modo mock.")
    return
  }
  
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}
