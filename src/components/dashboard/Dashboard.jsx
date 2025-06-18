// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import ProjectModal from '../projects/ProjectModal';
import TransactionModal from '../transactions/TransactionModal';
import AITransactionModal from '../transactions/AITransactionModal';
import ProjectReminders from './ProjectReminders';
import RecentProjects from './RecentProjects';
import RecentTransactions from './RecentTransactions';

const Dashboard = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    ongoingProjects: 0,
    totalValue: 0,
    totalPaid: 0,
    totalExpense: 0,
    totalProfit: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load recent projects
      const projectsQuery = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const projectSnapshot = await getDocs(projectsQuery);
      const projectList = [];
      projectSnapshot.forEach((doc) => {
        projectList.push({ id: doc.id, ...doc.data() });
      });
      setProjects(projectList);

      // Load recent transactions
      const transQuery = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc'),
        limit(10)
      );
      const transSnapshot = await getDocs(transQuery);
      const transList = [];
      transSnapshot.forEach((doc) => {
        transList.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transList);

      // Calculate statistics
      calculateStats(projectList, transList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (projectList, transList) => {
    try {
      // Get all projects for complete stats
      const allProjectsSnapshot = await getDocs(collection(db, 'projects'));
      const allProjects = [];
      allProjectsSnapshot.forEach((doc) => {
        allProjects.push({ id: doc.id, ...doc.data() });
      });

      // Get all transactions for complete stats
      const allTransSnapshot = await getDocs(collection(db, 'transactions'));
      const allTrans = [];
      allTransSnapshot.forEach((doc) => {
        allTrans.push({ id: doc.id, ...doc.data() });
      });

      const totalProjects = allProjects.length;
      const ongoingProjects = allProjects.filter(p => p.status === 'ongoing').length;
      const totalValue = allProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const totalPaid = allProjects.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      
      const totalIncome = allTrans
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalExpense = allTrans
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        totalProjects,
        ongoingProjects,
        totalValue,
        totalPaid,
        totalExpense,
        totalProfit: totalIncome - totalExpense
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Admin</h2>
        <p className="text-gray-600">Selamat datang, {currentUser.name || currentUser.email}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Proyek</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
              <p className="text-xs text-green-600">{stats.ongoingProjects} sedang berjalan</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Nilai Proyek</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalValue)}</p>
              <p className="text-xs text-blue-600">Nilai keseluruhan</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Terbayar</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalPaid)}</p>
              <p className="text-xs text-gray-600">
                {stats.totalValue > 0 ? Math.round((stats.totalPaid / stats.totalValue) * 100) : 0}% dari total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Keuntungan</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalProfit)}</p>
              <p className="text-xs text-gray-600">
                Margin {stats.totalPaid > 0 ? Math.round((stats.totalProfit / stats.totalPaid) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setShowProjectModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition-colors"
        >
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Proyek Baru
        </button>
        
        <button
          onClick={() => setShowAIModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center transition-colors"
        >
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Input dengan AI (Screenshot)
        </button>
        
        <button
          onClick={() => setShowTransactionModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition-colors"
        >
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Input Manual
        </button>
      </div>

      {/* Project Reminders */}
      <ProjectReminders projects={projects} />

      {/* Recent Projects */}
      <RecentProjects projects={projects} />

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} />

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSuccess={() => {
            setShowProjectModal(false);
            loadDashboardData();
          }}
          currentUser={currentUser}
        />
      )}

      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            setShowTransactionModal(false);
            loadDashboardData();
          }}
          projects={projects}
          currentUser={currentUser}
        />
      )}

      {showAIModal && (
        <AITransactionModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onSuccess={() => {
            setShowAIModal(false);
            loadDashboardData();
          }}
          projects={projects}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Dashboard;