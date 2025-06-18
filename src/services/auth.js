// src/services/auth.js
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

// Sign in with email and password
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Query users collection by email field
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', user.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Get the first matching document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('User data found:', userData); // Debug log
      
      return {
        uid: user.uid,
        email: user.email,
        name: userData.name || user.email,
        role: userData.role || 'user',
        docId: userDoc.id // Store document ID for future reference
      };
    } else {
      console.log('No user document found for email:', user.email);
      // If no user document exists, create basic user object
      return {
        uid: user.uid,
        email: user.email,
        name: user.email,
        role: 'user' // Default role
      };
    }
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
    // Query users collection by email field
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', user.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('Current user data:', userData); // Debug log
      
      return {
        uid: user.uid,
        email: user.email,
        name: userData.name || user.email,
        role: userData.role || 'user',
        docId: userDoc.id
      };
    }
    
    return {
      uid: user.uid,
      email: user.email,
      name: user.email,
      role: 'user'
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return {
      uid: user.uid,
      email: user.email,
      name: user.email,
      role: 'user'
    };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Query users collection by email field
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          console.log('Auth state changed - user data:', userData); // Debug log
          
          const userWithRole = {
            uid: user.uid,
            email: user.email,
            name: userData.name || user.email,
            role: userData.role || 'user',
            docId: userDoc.id
          };
          
          callback(userWithRole);
        } else {
          console.log('No user document found for:', user.email);
          callback({
            uid: user.uid,
            email: user.email,
            name: user.email,
            role: 'user'
          });
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        callback({
          uid: user.uid,
          email: user.email,
          name: user.email,
          role: 'user'
        });
      }
    } else {
      callback(null);
    }
  });
};