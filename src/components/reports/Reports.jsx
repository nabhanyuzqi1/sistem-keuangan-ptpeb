// src/components/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { getAllProjects } from '../../services/projects';
import { getAllTransactions } from '../../services/transactions';
import ReportCharts from './ReportCharts';
import { formatCurrency, getStatusLabel, calculateProjectProgress } from '../../utils/formatters';
import { PROJECT_STATUS } from '../../utils/constants';
import { generateFullReportPDF, generateTransactionReport } from '../../utils/pdfGenerator';

const Reports = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalValue: 0,
    totalPaid: 0,
    totalTax: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalProfit: 0,
    projectsByStatus: {},
    monthlyData: {},
    margin: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [projectList, transactionList] = await Promise.all([
        getAllProjects(),
        getAllTransactions()
      ]);
      
      setProjects(projectList);
      setTransactions(transactionList);
      calculateStats(projectList, transactionList);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectList, transactionList) => {
    // Filter by date range if specified
    let filteredTransactions = transactionList;
    if (dateRange.startDate && dateRange.endDate) {
      filteredTransactions = transactionList.filter(t => {
        const transDate = new Date(t.date);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return transDate >= start && transDate <= end;
      });
    }

    // Calculate basic stats
    const totalProjects = projectList.length;
    const totalValue = projectList.reduce((sum, p) => sum + (p.value || 0), 0);
    const totalPaid = projectList.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalTax = projectList.reduce((sum, p) => sum + ((p.value * p.taxRate / 100) || 0), 0);
    
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalProfit = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : 0;

    // Projects by status
    const projectsByStatus = {};
    Object.values(PROJECT_STATUS).forEach(status => {
      projectsByStatus[status] = {
        count: projectList.filter(p => p.status === status).length,
        value: projectList.filter(p => p.status === status).reduce((sum, p) => sum + (p.value || 0), 0)
      };
    });

    // Monthly data
    const monthlyData = {};
    filteredTransactions.forEach(t => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].income += t.amount || 0;
      } else {
        monthlyData[month].expense += t.amount || 0;
      }
    });

    setStats({
      totalProjects,
      totalValue,
      totalPaid,
      totalTax,
      totalIncome,
      totalExpense,
      totalProfit,
      margin,
      projectsByStatus,
      monthlyData
    });
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Recalculate when date range changes
  useEffect(() => {
    if (projects.length > 0 && transactions.length > 0) {
      calculateStats(projects, transactions);
    }
  }, [dateRange]);

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  // PDF Export Functions
  const handleExportFinancialReport = () => {
    generateFullReportPDF(projects, transactions, stats);
  };

  const handleExportTransactionReport = () => {
    // Filter transactions based on date range if specified
    let filteredTransactions = transactions;
    if (dateRange.startDate && dateRange.endDate) {
      filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return transDate >= start && transDate <= end;
      });
    }
    
    const filters = dateRange.startDate && dateRange.endDate ? {
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      }
    } : {};
    
    generateTransactionReport(filteredTransactions, filters);
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h2>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportFinancialReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            
            <button
              onClick={handleExportTransactionReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Transaksi
            </button>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearDateRange}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Nilai Proyek</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Dari {stats.totalProjects} proyek</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Terbayar</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalValue > 0 ? Math.round((stats.totalPaid / stats.totalValue) * 100) : 0}% dari total
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
          <p className="text-xs text-gray-500 mt-1">
            Dari {transactions.filter(t => t.type === 'expense').length} transaksi
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Keuntungan</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalProfit)}</p>
          <p className="text-xs text-gray-500 mt-1">Margin {stats.margin}%</p>
        </div>
      </div>

      {/* Project Status Overview */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Status Proyek</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.projectsByStatus).map(([status, data]) => (
              <div key={status} className="text-center">
                <span className={`status-badge status-${status}`}>
                  {getStatusLabel(status)}
                </span>
                <p className="text-2xl font-bold mt-2">{data.count}</p>
                <p className="text-xs text-gray-500">{formatCurrency(data.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <ReportCharts
        projects={projects}
        transactions={transactions}
        monthlyData={stats.monthlyData}
      />

      {/* Project List Table */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Daftar Semua Proyek</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyek
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terbayar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Belum ada data proyek
                  </td>
                </tr>
              ) : (
                projects.map(project => {
                  const progress = calculateProjectProgress(project);
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {project.partner}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge status-${project.status}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatCurrency(project.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(project.paidAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;