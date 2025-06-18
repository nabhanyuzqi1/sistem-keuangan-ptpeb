// src/services/auth.js
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Sign in with email and password
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    } else {
      // If user document doesn't exist, check by email
      const userDocByEmail = await getDoc(doc(db, 'users', email));
      if (userDocByEmail.exists()) {
        const userData = userDocByEmail.data();
        return {
          uid: user.uid,
          email: user.email,
          ...userData
        };
      }
    }
    
    return {
      uid: user.uid,
      email: user.email,
      role: 'user' // Default role
    };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user with role
export const getCurrentUserWithRole = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    // Try to get user by UID first
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    }
    
    // Try to get user by email
    const userDocByEmail = await getDoc(doc(db, 'users', user.email));
    if (userDocByEmail.exists()) {
      const userData = userDocByEmail.data();
      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    }
    
    return {
      uid: user.uid,
      email: user.email,
      role: 'user'
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return {
      uid: user.uid,
      email: user.email,
      role: 'user'
    };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userWithRole = await getCurrentUserWithRole();
      callback(userWithRole);
    } else {
      callback(null);
    }
  });
};