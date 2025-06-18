// src/utils/constants.js

export const STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const PROJECT_STATUS = {
  AKAN_DATANG: 'akan-datang',
  ONGOING: 'ongoing',
  RETENSI: 'retensi',
  SELESAI: 'selesai'
};

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

export const INCOME_CATEGORIES = [
  'Proyek',
  'Pembayaran',
  'Lainnya'
];

export const EXPENSE_CATEGORIES = [
  'Operasional',
  'Material',
  'Upah Karyawan/Tukang',
  'Pengeluaran Lain'
];

export const TAX_RATES = [
  { value: 0, label: 'Tanpa Pajak (0%)' },
  { value: 11, label: 'Dengan Pajak (11%)' }
];

export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#8b5cf6',
  secondary: '#6b7280'
};

export const DEADLINE_WARNING_DAYS = 30;

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';