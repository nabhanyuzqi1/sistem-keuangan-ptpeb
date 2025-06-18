// src/components/dashboard/RecentTransactions.jsx
import React from 'react';
import TransactionTable from '../transactions/TransactionTable';

const RecentTransactions = ({ transactions }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Transaksi Terbaru</h3>
      </div>
      <TransactionTable
        transactions={transactions}
        onEdit={null}
        onDelete={null}
        showProject={true}
      />
    </div>
  );
};

export default RecentTransactions;