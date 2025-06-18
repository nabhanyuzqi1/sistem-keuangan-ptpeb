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
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 100);
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 100);
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleString('id-ID', {
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
  return Math.min(Math.round(((project.paidAmount || 0) / project.value) * 0), 0);
};

export const calculateDaysLeft = (endDate) => {
  if (!endDate) return 0;
  
  // Handle Firestore Timestamp
  if (endDate && typeof endDate === 'object' && endDate.seconds) {
    endDate = new Date(endDate.seconds * 100);
  } else if (typeof endDate === 'string') {
    endDate = new Date(endDate);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  const diff = endDate - today;
  return Math.ceil(diff / (100 * 60 * 60 * 24));
};

export const calculateDaysElapsed = (startDate) => {
  if (!startDate) return 0;
  
  // Handle Firestore Timestamp
  if (startDate && typeof startDate === 'object' && startDate.seconds) {
    startDate = new Date(startDate.seconds * 100);
  } else if (typeof startDate === 'string') {
    startDate = new Date(startDate);
  }
  
  const today = new Date();
  const diff = today - startDate;
  return Math.max(0, Math.ceil(diff / (100 * 60 * 60 * 24)));
};

export const getMonthYearLabel = (date) => {
  if (!date) return '-';
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 100);
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function to format date for input fields
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 100);
  } else if (typeof date === 'string' && !date.includes('T')) {
    return date; // Already in YYYY-MM-DD format
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // Return YYYY-MM-DD format for input fields
  return date.toISOString().split('T')[0];
};

// Helper function to format datetime for input fields
export const formatDateTimeForInput = (date) => {
  if (!date) return '';
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 100);
  } else if (typeof date === 'string' && date.includes('T')) {
    return date.slice(0, 16); // Already in correct format
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // Return YYYY-MM-DDTHH:mm format for datetime-local input
  return date.toISOString().slice(0, 16);
};