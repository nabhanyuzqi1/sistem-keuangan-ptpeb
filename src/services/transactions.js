// src/services/transactions.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { updateProjectPaidAmount } from './projects';

const COLLECTION_NAME = 'transactions';

// Get all transactions
export const getAllTransactions = async () => {
  try {
    const transactionsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(transactionsQuery);
    const transactions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        // Ensure date is properly formatted
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

// Get transactions by project
export const getTransactionsByProject = async (projectId) => {
  try {
    const transactionsQuery = query(
      collection(db, COLLECTION_NAME),
      where('projectId', '==', projectId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(transactionsQuery);
    const transactions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        // Ensure date is properly formatted
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting project transactions:', error);
    if (error.code === 'failed-precondition') {
      console.error('Firestore index required for getTransactionsByProject query. Please create the index in Firebase console: https://console.firebase.google.com/v1/r/project/sistem-keuangan-ptpeb/firestore/indexes?create_composite=Clpwcm9qZWN0cy9zaXN0ZW0ta2V1YW5nYW4tcHRwZWIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3RyYW5zYWN0aW9ucy9pbmRleGVzL18QARoNCglwcm9qZWN0SWQQARoICgRkYXRlEAIaDAoIX19uYW1lX18QAg');
    }
    throw error;
  }
};

// Get recent transactions
export const getRecentTransactions = async (limitCount = 10) => {
  try {
    const transactionsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(transactionsQuery);
    const transactions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        // Ensure date is properly formatted
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};

// Create transaction
export const createTransaction = async (transactionData, userId, userEmail) => {
  try {
    // Create the transaction
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...transactionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId,
      userEmail
    });
    
    // Update project paid amount if it's an income transaction
    if (transactionData.type === 'income' && transactionData.projectId) {
      await updateProjectPaidAmount(transactionData.projectId, transactionData.amount);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Update transaction
export const updateTransaction = async (transactionId, newData, oldData, userId, userEmail) => {
  try {
    // Update the transaction
    await updateDoc(doc(db, COLLECTION_NAME, transactionId), {
      ...newData,
      updatedAt: serverTimestamp(),
      userId,
      userEmail
    });
    
    // Handle project paid amount updates
    if (oldData.type === 'income' && oldData.projectId) {
      // Subtract old amount
      await updateProjectPaidAmount(oldData.projectId, -oldData.amount);
    }
    
    if (newData.type === 'income' && newData.projectId) {
      // Add new amount
      await updateProjectPaidAmount(newData.projectId, newData.amount);
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Delete transaction
export const deleteTransaction = async (transactionId, transactionData) => {
  try {
    // Delete the transaction
    await deleteDoc(doc(db, COLLECTION_NAME, transactionId));
    
    // Update project paid amount if it was an income transaction
    if (transactionData.type === 'income' && transactionData.projectId) {
      await updateProjectPaidAmount(transactionData.projectId, -transactionData.amount);
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Upload transaction image
export const uploadTransactionImage = async (file) => {
  try {
    const timestamp = Date.now();
    const fileName = `transactions/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Get transaction statistics
export const getTransactionStats = async (projectId = null) => {
  try {
    let transactionsQuery;
    if (projectId) {
      transactionsQuery = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId)
      );
    } else {
      transactionsQuery = collection(db, COLLECTION_NAME);
    }
    
    const snapshot = await getDocs(transactionsQuery);
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === 'income') {
        totalIncome += data.amount || 0;
      } else {
        totalExpense += data.amount || 0;
      }
      
      if (!categoryBreakdown[data.category]) {
        categoryBreakdown[data.category] = 0;
      }
      categoryBreakdown[data.category] += data.amount || 0;
    });
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryBreakdown
    };
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    throw error;
  }
};