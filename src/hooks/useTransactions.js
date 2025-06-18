// src/hooks/useTransactions.js
import { useState, useEffect, useCallback } from 'react';
import {
  getAllTransactions,
  getTransactionsByProject,
  addTransaction as addTransactionService, // Renamed to avoid conflict
  updateTransaction,
  deleteTransaction,
  getTransactionStats
} from '../services/transactions';
import { calculateTransactionTotals } from '../utils/calculations';

export const useTransactions = (projectId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let transactionList;
      if (projectId) {
        transactionList = await getTransactionsByProject(projectId);
      } else {
        transactionList = await getAllTransactions(); // Fixed: use proper function
      }
      setTransactions(transactionList);
      
      // Calculate stats
      const transactionStats = calculateTransactionTotals(transactionList); // Fixed
      setStats(transactionStats);
    } catch (error) {
      setError(error.message);
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = useCallback(async (transactionData, userId, userEmail) => {
    setLoading(true);
    setError(null);
    try {
      const transactionId = await addTransactionService(transactionData, userId, userEmail); // Fixed
      await loadTransactions(); // Reload transactions
      return transactionId;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  const editTransaction = useCallback(async (transactionId, newData, oldData, userId, userEmail) => {
    setLoading(true);
    setError(null);
    try {
      await updateTransaction(transactionId, newData, oldData, userId, userEmail);
      await loadTransactions(); // Reload transactions
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  const removeTransaction = useCallback(async (transactionId, transactionData) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTransaction(transactionId, transactionData);
      await loadTransactions(); // Reload transactions
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  const filterTransactionsByType = useCallback((type) => {
    if (type === 'all') return transactions;
    return transactions.filter(transaction => transaction.type === type);
  }, [transactions]);

  const filterTransactionsByDateRange = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return transactions;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return transactions.filter(transaction => {
      const transDate = new Date(transaction.date);
      return transDate >= start && transDate <= end;
    });
  }, [transactions]);

  const searchTransactions = useCallback((searchTerm) => {
    const term = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(term) ||
      transaction.category.toLowerCase().includes(term) ||
      (transaction.projectName && transaction.projectName.toLowerCase().includes(term))
    );
  }, [transactions]);

  return {
    transactions,
    stats,
    loading,
    error,
    loadTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    filterTransactionsByType,
    filterTransactionsByDateRange,
    searchTransactions
  };
};