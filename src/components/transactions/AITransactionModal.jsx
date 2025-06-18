// src/components/transactions/AITransactionModal.jsx
import React, { useState } from 'react';
import { addTransaction } from '../../services/transactions';
import { analyzeTransactionImage, validateImageFile } from '../../services/ai';
import { formatDateTimeForInput } from '../../utils/formatters';
import { TRANSACTION_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/constants';

const AITransactionModal = ({ isOpen, onClose, onSuccess, projects, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [editedData, setEditedData] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setSelectedFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }

    if (!selectedProjectId) {
      setError('Pilih proyek terlebih dahulu');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const result = await analyzeTransactionImage(selectedFile, currentUser.uid);
      console.log('Analysis complete:', result);
      
      setAiResult(result);
      setEditedData({
        ...result,
        projectId: selectedProjectId
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Gagal menganalisis gambar. Pastikan gambar jelas dan berisi informasi transaksi.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!editedData || !editedData.projectId) {
      setError('Data tidak lengkap');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const project = projects.find(p => p.id === editedData.projectId);
      if (!project) {
        throw new Error('Proyek tidak ditemukan');
      }

      const transactionData = {
        ...editedData,
        projectId: editedData.projectId,
        projectName: project.name,
        date: editedData.date || new Date().toISOString(),
        createdAt: new Date(),
        createdBy: currentUser.uid,
        isAIProcessed: true,
        imageUrl: editedData.imageUrl,
        imagePath: editedData.imagePath
      };

      await addTransaction(transactionData);
      console.log('Transaction saved successfully');
      
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiResult(null);
    setEditedData(null);
    setError('');
    setSelectedProjectId('');
    onClose();
  };

  if (!isOpen) return null;

  const categories = editedData?.type === TRANSACTION_TYPES.INCOME 
    ? INCOME_CATEGORIES 
    : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Input Transaksi dengan AI</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Project Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">1</span>
              Pilih Proyek
            </h3>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                if (editedData) {
                  setEditedData({ ...editedData, projectId: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">-- Pilih Proyek --</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.partner}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: File Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">2</span>
              Upload Screenshot
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-purple-600 hover:text-purple-500">
                    Klik untuk upload
                  </span> atau drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WebP hingga 5MB
                </p>
              </label>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full h-48 object-contain border rounded"
                />
              </div>
            )}
          </div>

          {/* Step 3: Analyze Button */}
          {selectedFile && selectedProjectId && !aiResult && (
            <div className="mb-6">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className={`w-full px-4 py-3 rounded-md transition-colors flex items-center justify-center ${
                  analyzing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menganalisis gambar dengan AI...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Analisis dengan AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4: AI Result and Edit Form */}
          {aiResult && editedData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">3</span>
                Verifikasi Hasil AI
              </h3>

              <div className="p-4 bg-purple-50 rounded-lg mb-4">
                <p className="text-sm font-medium text-purple-800 mb-2">Hasil Analisis AI:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="ml-2 font-medium">{new Date(aiResult.date).toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nominal:</span>
                    <span className="ml-2 font-medium">Rp {aiResult.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Jenis:</span>
                    <span className="ml-2 font-medium">{aiResult.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Kategori:</span>
                    <span className="ml-2 font-medium">{aiResult.category}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Deskripsi:</span>
                    <span className="ml-2 font-medium">{aiResult.description}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Periksa dan edit data jika diperlukan:
              </p>

              {/* Edit Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal & Waktu
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeForInput(editedData.date)}
                      onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Transaksi
                    </label>
                    <select
                      value={editedData.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setEditedData({ 
                          ...editedData, 
                          type: newType,
                          category: newType === TRANSACTION_TYPES.INCOME 
                            ? INCOME_CATEGORIES[0] 
                            : EXPENSE_CATEGORIES[0]
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={TRANSACTION_TYPES.INCOME}>Pemasukan</option>
                      <option value={TRANSACTION_TYPES.EXPENSE}>Pengeluaran</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={editedData.category}
                      onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nominal (Rp)
                    </label>
                    <input
                      type="number"
                      value={editedData.amount}
                      onChange={(e) => setEditedData({ ...editedData, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      step="10100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={editedData.description}
                    onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Deskripsi transaksi..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Batal
            </button>
            {aiResult && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-4 py-2 rounded-md transition-colors ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Transaksi'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITransactionModal;