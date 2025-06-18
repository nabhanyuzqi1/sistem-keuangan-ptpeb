// src/components/projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../../services/projects';
import { getTransactionsByProject } from '../../services/transactions';
import TransactionModal from '../transactions/TransactionModal';
import TransactionTable from '../transactions/TransactionTable';
import { formatCurrency, formatDate, getStatusLabel, calculateProjectProgress, calculateDaysLeft } from '../../utils/formatters';
import { generateProjectPDF } from '../../utils/pdfGenerator';
import { shareProjectWhatsApp } from '../../utils/sharing';

const ProjectDetail = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectData, transactionData] = await Promise.all([
        getProject(id),
        getTransactionsByProject(id)
      ]);
      setProject(projectData);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Gagal memuat data proyek. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleModalClose = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadProjectData();
  };

  const handleGeneratePDF = () => {
    if (project) {
      generateProjectPDF(project, transactions);
    }
  };

  const handleShareWhatsApp = () => {
    if (project) {
      shareProjectWhatsApp(project, transactions);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>{error || 'Proyek tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Kembali ke daftar proyek
        </button>
      </div>
    );
  }

  const progress = calculateProjectProgress(project);
  const daysLeft = calculateDaysLeft(project.endDate);
  const totalValue = project.value * (1 + project.taxRate / 100);
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Proyek
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <p className="text-gray-600">{project.partner}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={handleGeneratePDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-3">Informasi Proyek</h3>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Status: <span className={`status-badge status-${project.status}`}>{getStatusLabel(project.status)}</span>
            </p>
            <p className="text-xs text-gray-500">Mulai: {formatDate(project.startDate)}</p>
            <p className="text-xs text-gray-500">Selesai: {formatDate(project.endDate)}</p>
            <p className="text-xs text-gray-500">No. SPK/MOU: {project.contractNumber || '-'}</p>
            {project.description && (
              <p className="text-xs text-gray-500 mt-2">Deskripsi: {project.description}</p>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-3">Nilai & Pembayaran</h3>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Nilai: {formatCurrency(project.value)}</p>
            <p className="text-xs text-gray-500">Pajak ({project.taxRate}%): {formatCurrency(project.value * project.taxRate / 100)}</p>
            <p className="text-xs text-gray-500 font-semibold">Total: {formatCurrency(totalValue)}</p>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-gray-500">
                Terbayar: <span className="text-green-600 font-semibold">{formatCurrency(project.paidAmount || 0)}</span>
              </p>
              <p className="text-xs text-gray-500">
                Sisa: <span className="text-red-600 font-semibold">{formatCurrency(project.value - (project.paidAmount || 0))}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-3">Progress</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${progress}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
              ></div>
            </div>
          </div>
          {project.status === 'ongoing' && daysLeft > 0 && (
            <p className="text-xs text-gray-500">Sisa waktu: {daysLeft} hari</p>
          )}
          {project.status === 'ongoing' && daysLeft === 0 && (
            <p className="text-xs text-red-600 font-semibold">Deadline hari ini!</p>
          )}
          {project.status === 'ongoing' && daysLeft < 0 && (
            <p className="text-xs text-red-600 font-semibold">Terlambat {Math.abs(daysLeft)} hari</p>
          )}
        </div>
      </div>

      {/* Add Transaction Button */}
      {currentUser && currentUser.role === 'admin' && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowTransactionModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Transaksi
          </button>
        </div>
      )}

      {/* Transaction Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Total Pemasukan</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(income)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(expense)}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Saldo</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Transaksi Proyek</h3>
        </div>
        <TransactionTable
          transactions={transactions}
          onEdit={currentUser?.role === 'admin' ? handleEditTransaction : null}
          onDelete={currentUser?.role === 'admin' ? loadProjectData : null}
          showProject={false}
        />
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          transaction={editingTransaction}
          projectId={project.id}
          projects={[project]}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ProjectDetail;