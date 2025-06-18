// src/utils/formatters.js

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusLabel = (status) => {
  const labels = {
    'akan-datang': 'Akan Datang',
    'ongoing': 'On Going',
    'retensi': 'Retensi',
    'selesai': 'Selesai'
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    'akan-datang': 'gray',
    'ongoing': 'blue',
    'retensi': 'yellow',
    'selesai': 'green'
  };
  return colors[status] || 'gray';
};

export const calculateProjectProgress = (project) => {
  if (!project || !project.value || project.value === 0) return 0;
  return Math.min(Math.round(((project.paidAmount || 0) / project.value) * 100), 100);
};

export const calculateDaysLeft = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const today = new Date();
  const diff = end - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const calculateDaysElapsed = (startDate) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  const diff = today - start;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const getMonthYearLabel = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};