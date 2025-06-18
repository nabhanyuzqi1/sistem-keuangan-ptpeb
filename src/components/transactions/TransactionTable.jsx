// src/components/transactions/TransactionTable.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { TRANSACTION_TYPES } from '../../utils/constants';

const TransactionTable = ({ transactions, onEdit, onDelete, showProject = true }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (transaction) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      return;
    }

    setDeletingId(transaction.id);
    
    try {
      // Call the onDelete function passed from parent
      if (onDelete) {
        await onDelete(transaction);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Gagal menghapus transaksi. Silakan coba lagi.');
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        Belum ada transaksi
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal
            </th>
            {showProject && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proyek
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Keterangan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kategori
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nominal
            </th>
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {formatDateTime(transaction.date)}
                {transaction.isAIProcessed && (
                  <span className="ml-1 text-xs text-purple-600" title="Diproses dengan AI">
                    (AI)
                  </span>
                )}
              </td>
              {showProject && (
                <td className="px-6 py-4 text-sm">
                  {transaction.projectName || '-'}
                </td>
              )}
              <td className="px-6 py-4 text-sm">
                <div className="max-w-xs">
                  <p className="truncate">{transaction.description}</p>
                  {transaction.imageUrl && (
                    <a
                      href={transaction.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs inline-flex items-center mt-1"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Lihat Bukti
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {transaction.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <span className={transaction.type === TRANSACTION_TYPES.INCOME ? 'text-green-600' : 'text-red-600'}>
                  {transaction.type === TRANSACTION_TYPES.INCOME ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </td>
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={deletingId === transaction.id}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(transaction)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deletingId === transaction.id}
                      >
                        {deletingId === transaction.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;