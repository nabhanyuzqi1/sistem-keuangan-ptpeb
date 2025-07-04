// src/components/projects/ProjectModal.jsx
import React, { useState, useEffect } from 'react';
import { addProject, updateProject } from '../../services/projects';
import { PROJECT_STATUS, TAX_RATES } from '../../utils/constants';

// Helper functions
const formatNumberDisplay = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const formatDateForInput = (date) => {
  if (!date) return '';
  
  // Handle string dates
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // If in ISO format, extract date part
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [day, month, year] = date.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Handle Date objects or timestamps
  try {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Error parsing date:', e);
  }
  
  return '';
};

const ProjectModal = ({ isOpen, onClose, onSuccess, project, currentUser }) => {
  const isEdit = project !== null && project !== undefined;
  
  const [formData, setFormData] = useState({
    name: project?.name || '',
    partner: project?.partner || '',
    contractNumber: project?.contractNumber || '',
    status: project?.status || PROJECT_STATUS.AKAN_DATANG,
    value: project?.value ? project.value.toString() : '',
    taxRate: project?.taxRate !== undefined ? project.taxRate : 11,
    startDate: formatDateForInput(project?.startDate) || '',
    endDate: formatDateForInput(project?.endDate) || '',
    description: project?.description || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [displayValue, setDisplayValue] = useState(() => {
    return formatNumberDisplay(project?.value || '');
  });

  // Update form when project prop changes
  useEffect(() => {
    if (isOpen) {
      const initialValue = project?.value ? project.value.toString() : '';
      setFormData({
        name: project?.name || '',
        partner: project?.partner || '',
        contractNumber: project?.contractNumber || '',
        status: project?.status || PROJECT_STATUS.AKAN_DATANG,
        value: initialValue,
        taxRate: project?.taxRate !== undefined ? project.taxRate : 11,
        startDate: formatDateForInput(project?.startDate) || '',
        endDate: formatDateForInput(project?.endDate) || '',
        description: project?.description || ''
      });
      setDisplayValue(formatNumberDisplay(initialValue));
      setErrors({});
    }
  }, [isOpen, project]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama proyek harus diisi';
    }
    
    if (!formData.partner.trim()) {
      newErrors.partner = 'Mitra/Partner harus diisi';
    }
    
    const numericValue = parseInt(formData.value, 10) || 0;
    if (!formData.value || formData.value === '' || numericValue <= 0) {
      newErrors.value = 'Nilai proyek harus lebih dari 0';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Tanggal mulai harus diisi';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Tanggal selesai harus diisi';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form data before validation:', formData); // Debug log
    
    if (!validateForm()) {
      console.log('Validation failed:', errors); // Debug log
      return;
    }
    
    setLoading(true);
    
    try {
      // Parse and ensure valid numeric values
      const numericValue = parseInt(formData.value, 10) || 0;
      const numericTaxRate = parseFloat(formData.taxRate) || 0;
      
      // Validate numeric values
      if (numericValue <= 0) {
        throw new Error('Nilai proyek harus lebih dari 0');
      }
      
      // Clean and validate all data
      const cleanedFormData = {
        name: formData.name.trim(),
        partner: formData.partner.trim(),
        contractNumber: formData.contractNumber.trim(),
        status: formData.status,
        value: numericValue,
        taxRate: numericTaxRate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim()
      };
      
      console.log('Submitting project data:', cleanedFormData); // Debug log
      
      if (isEdit) {
        await updateProject(project.id, cleanedFormData, currentUser.uid, currentUser.email);
      } else {
        await addProject(cleanedFormData, currentUser.uid, currentUser.email);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      alert(`Gagal menyimpan proyek: ${error.message}`);
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

  // Handle value input with better formatting
  const handleValueChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setFormData(prev => ({ ...prev, value: '' }));
      setDisplayValue('');
      return;
    }
    
    // Remove all non-digits
    const numericValue = inputValue.replace(/\D/g, '');
    
    // Update the numeric value in formData
    setFormData(prev => ({
      ...prev,
      value: numericValue
    }));
    
    // Update display with formatting
    setDisplayValue(formatNumberDisplay(numericValue));
    
    // Clear error if exists
    if (errors.value) {
      setErrors(prev => ({
        ...prev,
        value: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit' : 'Tambah'} Proyek
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Proyek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mitra/Partner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partner"
                value={formData.partner}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.partner ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.partner && <p className="text-red-500 text-xs mt-1">{errors.partner}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. SPK/MOU
              </label>
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value={PROJECT_STATUS.AKAN_DATANG}>Akan Datang</option>
                <option value={PROJECT_STATUS.ONGOING}>On Going</option>
                <option value={PROJECT_STATUS.RETENSI}>Retensi</option>
                <option value={PROJECT_STATUS.SELESAI}>Selesai</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nilai Proyek (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="value"
                value={displayValue}
                onChange={handleValueChange}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.value ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pajak (%) <span className="text-red-500">*</span>
              </label>
              <select
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {TAX_RATES.map(rate => (
                  <option key={rate.value} value={rate.value}>
                    {rate.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
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

export default ProjectModal;