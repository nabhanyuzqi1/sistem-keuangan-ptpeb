// src/components/transactions/TransactionModal.jsx
import React, { useState, useEffect } from 'react';
import { createTransaction, updateTransaction } from '../../services/transactions';
import { getAllProjects } from '../../services/projects';
import { TRANSACTION_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/constants';

const TransactionModal = ({ isOpen, onClose, onSuccess, transaction, projectId, projects: providedProjects, currentUser }) => {
  const isEdit = transaction !== null && transaction !== undefined;
  
  const [projects, setProjects] = useState(providedProjects || []);
  const [formData, setFormData] = useState({
    projectId: transaction?.projectId || projectId || '',
    date: transaction?.date || new Date().toISOString().slice(0, 16),
    type: transaction?.type || TRANSACTION_TYPES.EXPENSE,
    category: transaction?.category || '',
    amount: transaction?.amount || '',
    description: transaction?.description || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!providedProjects) {
      loadProjects();
    }
  }, [providedProjects]);

  useEffect(() => {
    // Update category when type changes
    if (!isEdit || formData.type !== transaction?.type) {
      const categories = formData.type === TRANSACTION_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setFormData(prev => ({
        ...prev,
        category: categories[0]
      }));
    }
  }, [formData.type, isEdit, transaction]);

  const loadProjects = async () => {
    try {
      const projectList = await getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectId) {
      newErrors.projectId = 'Proyek harus dipilih';
    }
    
    if (!formData.date) {
      newErrors.date = 'Tanggal harus diisi';
    }
    
    if (!formData.category) {
      newErrors.category = 'Kategori harus dipilih';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Nominal harus lebih dari 0';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Keterangan harus diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const project = projects.find(p => p.id === formData.projectId);
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        projectName: project?.name || ''
      };
      
      if (isEdit) {
        await updateTransaction(
          transaction.id,
          transactionData,
          transaction,
          currentUser.uid,
          currentUser.email
        );
      } else {
        await createTransaction(transactionData, currentUser.uid, currentUser.email);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Gagal menyimpan transaksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const categories = formData.type === TRANSACTION_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit' : 'Tambah'} Transaksi Manual
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyek <span className="text-red-500">*</span>
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.projectId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || projectId}
            >
              <option value="">Pilih Proyek</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.partner}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-red-500 text-xs mt-1">{errors.projectId}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Transaksi <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value={TRANSACTION_TYPES.INCOME}>Pemasukan</option>
              <option value={TRANSACTION_TYPES.EXPENSE}>Pengeluaran</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nominal (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="1000"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                isEdit ? 'Simpan Perubahan' : 'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;