// src/components/reports/ReportCharts.jsx
import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency, getMonthYearLabel } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportCharts = ({ projects, transactions, monthlyData }) => {
  // Calculate expense by category
  const expenseByCategory = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  // Calculate projects by partner
  const projectsByPartner = {};
  projects.forEach(p => {
    if (!projectsByPartner[p.partner]) {
      projectsByPartner[p.partner] = {
        count: 0,
        value: 0
      };
    }
    projectsByPartner[p.partner].count += 1;
    projectsByPartner[p.partner].value += p.value;
  });

  // Sort partners by value
  const sortedPartners = Object.entries(projectsByPartner)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 10); // Top 10 partners

  // Prepare monthly trend data
  const months = Object.keys(monthlyData).sort();
  const monthLabels = months.map(m => getMonthYearLabel(m + '-01'));

  // Chart configurations
  const expenseCategoryData = {
    labels: Object.keys(expenseByCategory),
    datasets: [{
      data: Object.values(expenseByCategory),
      backgroundColor: [
        CHART_COLORS.primary,
        CHART_COLORS.secondary,
        CHART_COLORS.warning,
        CHART_COLORS.danger,
        CHART_COLORS.info,
        CHART_COLORS.success
      ],
      borderWidth: 0
    }]
  };

  const partnerData = {
    labels: sortedPartners.map(([partner]) => partner),
    datasets: [{
      label: 'Nilai Proyek',
      data: sortedPartners.map(([, data]) => data.value),
      backgroundColor: CHART_COLORS.primary,
      borderRadius: 4
    }]
  };

  const monthlyTrendData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Pemasukan',
        data: months.map(m => monthlyData[m].income),
        borderColor: CHART_COLORS.success,
        backgroundColor: CHART_COLORS.success + '20',
        tension: 0.1,
        fill: true
      },
      {
        label: 'Pengeluaran',
        data: months.map(m => monthlyData[m].expense),
        borderColor: CHART_COLORS.danger,
        backgroundColor: CHART_COLORS.danger + '20',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Expense by Category */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Pengeluaran</h3>
        <div className="chart-container">
          {Object.keys(expenseByCategory).length > 0 ? (
            <Doughnut data={expenseCategoryData} options={doughnutOptions} />
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada data pengeluaran</p>
          )}
        </div>
      </div>

      {/* Projects by Partner */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Mitra (Nilai Proyek)</h3>
        <div className="chart-container">
          {sortedPartners.length > 0 ? (
            <Bar data={partnerData} options={barChartOptions} />
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada data proyek</p>
          )}
        </div>
      </div>

      {/* Monthly Trend - Full Width */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Bulanan</h3>
        <div className="chart-container" style={{ height: '400px' }}>
          {months.length > 0 ? (
            <Line data={monthlyTrendData} options={lineChartOptions} />
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada data transaksi</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCharts;