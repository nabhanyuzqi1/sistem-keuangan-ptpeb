// src/utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, getStatusLabel, calculateProjectProgress } from './formatters';

// Company information
const COMPANY_INFO = {
  name: 'PT Permata Energi Borneo',
  address: 'Jl. Gatot Subroto (Gedung Permata)',
  city: 'Sampit, Kalimantan Tengah',
  phone: '08115188808',
  email: 'permataenergiborneo@gmail.com'
};



// Helper function to format date shorter for tables
const formatDateShort = (date) => {
  if (!date) return '-';
  
  const dateObj = date && typeof date === 'object' && date.seconds
    ? new Date(date.seconds * 1000)
    : new Date(date);
    
  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Helper function to add header
const addHeader = (doc, title, isNewPage = false) => {
  // Clear area if it's a new page to prevent overlapping
  if (isNewPage) {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 55, 'F');
  }
  
  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_INFO.name, 105, 20, { align: 'center' });
  
  // Title
  doc.setFontSize(14);
  doc.text(title, 105, 32, { align: 'center' });
  
  // Company info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}`, 105, 40, { align: 'center' });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, 105, 46, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);
  
  return 60; // Return Y position for content with more space
};

// Helper function to add header for landscape
const addHeaderLandscape = (doc, title, isNewPage = false) => {
  // Clear area if it's a new page
  if (isNewPage) {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 55, 'F');
  }
  
  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_INFO.name, 148.5, 20, { align: 'center' });
  
  // Title
  doc.setFontSize(14);
  doc.text(title, 148.5, 32, { align: 'center' });
  
  // Company info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}`, 148.5, 40, { align: 'center' });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, 148.5, 46, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 50, 277, 50);
  
  return 60;
};

// Helper function to add footer
const addFooter = (doc, pageNumber) => {
  const pageHeight = doc.internal.pageSize.height;
  
  // Line separator
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 20, doc.internal.pageSize.width - 20, pageHeight - 20);
  
  // Page number and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Halaman ${pageNumber}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(
    `Dicetak pada: ${formatDate(new Date())}`,
    20,
    pageHeight - 10
  );
};

/**
 * Generate Project Report PDF
 * @param {Object} project - Project data
 * @param {Array} transactions - Project transactions
 */
export const generateProjectPDF = (project, transactions = []) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'LAPORAN PROYEK');
  
  // Project Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(project.name, 20, yPos);
  yPos += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mitra: ${project.partner}`, 20, yPos);
  yPos += 6;
  doc.text(`Status: ${getStatusLabel(project.status)}`, 20, yPos);
  yPos += 6;
  doc.text(`No. SPK/MOU: ${project.contractNumber || '-'}`, 20, yPos);
  yPos += 6;
  doc.text(`Periode: ${formatDateShort(project.startDate)} - ${formatDateShort(project.endDate)}`, 20, yPos);
  yPos += 12;
  
  // Financial Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN KEUANGAN', 20, yPos);
  yPos += 8;
  
  // Calculate totals
  const totalValue = project.value * (1 + project.taxRate / 100);
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = income - expense;
  
  // Financial details table
  const financialData = [
    ['Nilai Proyek', formatCurrency(project.value)],
    [`Pajak (${project.taxRate}%)`, formatCurrency(project.value * project.taxRate / 100)],
    ['Total Nilai', formatCurrency(totalValue)],
    ['', ''],
    ['Total Pemasukan', formatCurrency(income)],
    ['Total Pengeluaran', formatCurrency(expense)],
    ['Saldo', formatCurrency(balance)],
    ['', ''],
    ['Terbayar', formatCurrency(project.paidAmount || 0)],
    ['Sisa Pembayaran', formatCurrency(project.value - (project.paidAmount || 0))],
    ['Progress', `${calculateProjectProgress(project)}%`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: financialData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'normal' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20 },
    didParseCell: function(data) {
      // Make empty rows smaller
      if (data.row.raw[0] === '' && data.row.raw[1] === '') {
        data.cell.styles.minCellHeight = 3;
      }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Project Description
  if (project.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESKRIPSI PROYEK', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(project.description, 170);
    lines.forEach(line => {
      if (yPos > 250) {
        doc.addPage();
        yPos = addHeader(doc, 'LAPORAN PROYEK (Lanjutan)', true);
      }
      doc.text(line, 20, yPos);
      yPos += 6;
    });
    yPos += 5;
  }
  
  // Transaction Details
  if (transactions.length > 0) {
    // Check if need new page
    if (yPos > 200) {
      doc.addPage();
      yPos = addHeader(doc, 'LAPORAN PROYEK (Lanjutan)', true);
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL TRANSAKSI', 20, yPos);
    yPos += 10;
    
    // Prepare transaction data with shorter text
    const transactionData = transactions.map((t, index) => [
      (index + 1).toString(),
      formatDateShort(t.date),
      t.type === 'income' ? 'Masuk' : 'Keluar',
      t.category && t.category.length > 15 ? t.category.substring(0, 15) + '..' : (t.category || '-'),
      t.description && t.description.length > 35 ? t.description.substring(0, 35) + '...' : (t.description || '-'),
      t.type === 'income' ? formatCurrency(t.amount) : `(${formatCurrency(t.amount)})`
    ]);
    
    // Add totals row
    transactionData.push([
      '',
      '',
      '',
      '',
      'TOTAL',
      formatCurrency(income - expense)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Jumlah']],
      body: transactionData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 55 },
        5: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto',
      showHead: 'firstPage',
      didDrawPage: function(data) {
        // Clear top area and add header for new pages
        if (data.pageNumber > 1) {
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, 210, 60, 'F');
          addHeader(doc, 'LAPORAN PROYEK (Lanjutan)', true);
        }
      },
      // Style the total row
      willDrawCell: function(data) {
        if (data.row.index === transactionData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });
  }
  
  // Add footer to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }
  
  // Save
  const fileName = `Laporan_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

/**
 * Generate Invoice PDF
 * @param {Object} project - Project data
 * @param {Object} invoiceData - Invoice specific data
 */
export const generateInvoice = (project, invoiceData = {}) => {
  const doc = new jsPDF();
  let yPos = 20;
  
  // Invoice Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, yPos, { align: 'center' });
  yPos += 15;
  
  // Company Info
  doc.setFontSize(14);
  doc.text(COMPANY_INFO.name, 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 20, yPos);
  yPos += 5;
  doc.text(`${COMPANY_INFO.city}`, 20, yPos);
  yPos += 5;
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, 20, yPos);
  yPos += 10;
  
  // Invoice Info
  const invoiceNumber = invoiceData.number || `INV-${project.id.slice(-6).toUpperCase()}-${new Date().getTime()}`;
  const invoiceDate = invoiceData.date || new Date();
  
  doc.setFont('helvetica', 'bold');
  doc.text(`No. Invoice: ${invoiceNumber}`, 120, 35);
  doc.text(`Tanggal: ${formatDate(invoiceDate)}`, 120, 42);
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  // Bill To
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada:', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(project.partner, 20, yPos);
  yPos += 20;
  
  // Invoice Items
  const items = [];
  
  // Main project item
  items.push([
    project.name,
    '1',
    formatCurrency(project.value),
    formatCurrency(project.value)
  ]);
  
  // Calculate totals
  const subtotal = project.value;
  const taxAmount = project.value * project.taxRate / 100;
  const total = subtotal + taxAmount;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Deskripsi', 'Qty', 'Harga Satuan', 'Total']],
    body: items,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 11
    },
    styles: {
      fontSize: 11,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Totals
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 130, yPos);
  doc.text(formatCurrency(subtotal), 185, yPos, { align: 'right' });
  yPos += 7;
  
  if (project.taxRate > 0) {
    doc.text(`Pajak (${project.taxRate}%):`, 130, yPos);
    doc.text(formatCurrency(taxAmount), 185, yPos, { align: 'right' });
    yPos += 7;
  }
  
  // Total line
  doc.setLineWidth(0.3);
  doc.line(130, yPos - 2, 185, yPos - 2);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 130, yPos + 5);
  doc.text(formatCurrency(total), 185, yPos + 5, { align: 'right' });
  
  // Payment Terms
  yPos += 25;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Syarat Pembayaran:', 20, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text('• Pembayaran dilakukan dalam 30 hari setelah tanggal invoice', 20, yPos);
  yPos += 6;
  doc.text('• Transfer ke rekening yang tertera di bawah', 20, yPos);
  
  // Bank Information
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Informasi Bank:', 20, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Bank: [Nama Bank]', 20, yPos);
  yPos += 6;
  doc.text('No. Rekening: [Nomor Rekening]', 20, yPos);
  yPos += 6;
  doc.text('Atas Nama: ' + COMPANY_INFO.name, 20, yPos);
  
  // Signature area
  yPos = 220;
  doc.text('Hormat kami,', 130, yPos);
  yPos += 25;
  doc.text('_____________________', 130, yPos);
  yPos += 6;
  doc.text('[Nama Penandatangan]', 130, yPos);
  yPos += 5;
  doc.text('[Jabatan]', 130, yPos);
  
  // Footer
  addFooter(doc, 1);
  
  // Save
  doc.save(`Invoice_${project.name.replace(/\s+/g, '_')}_${invoiceNumber}.pdf`);
};

/**
 * Generate Full Financial Report PDF
 * @param {Array} projects - All projects
 * @param {Array} transactions - All transactions
 * @param {Object} stats - Calculated statistics
 */
export const generateFullReportPDF = (projects, transactions, stats) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'LAPORAN KEUANGAN KESELURUHAN');
  
  // Report Period
  doc.setFontSize(11);
  doc.text(`Per tanggal: ${formatDate(new Date())}`, 105, yPos, { align: 'center' });
  yPos += 15;
  
  // Summary Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN KEUANGAN', 20, yPos);
  yPos += 10;
  
  // Summary table
  const summaryData = [
    ['Total Proyek', stats.totalProjects.toString()],
    ['Total Nilai Proyek', formatCurrency(stats.totalValue)],
    ['Total Terbayar', formatCurrency(stats.totalPaid)],
    ['Total Pajak', formatCurrency(stats.totalTax || 0)],
    ['', ''],
    ['Total Pemasukan', formatCurrency(stats.totalIncome)],
    ['Total Pengeluaran', formatCurrency(stats.totalExpense)],
    ['Keuntungan', formatCurrency(stats.totalProfit)],
    ['Margin Keuntungan', `${stats.margin}%`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20 },
    didParseCell: function(data) {
      if (data.row.raw[0] === '' && data.row.raw[1] === '') {
        data.cell.styles.minCellHeight = 3;
      }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Projects by Status
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS PROYEK', 20, yPos);
  yPos += 10;
  
  const statusData = Object.entries(stats.projectsByStatus).map(([status, data]) => [
    getStatusLabel(status),
    data.count.toString(),
    formatCurrency(data.value)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Jumlah', 'Total Nilai']],
    body: statusData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 11
    },
    styles: {
      fontSize: 11,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: 20 }
  });
  
  // Project List - New Page
  doc.addPage();
  yPos = addHeader(doc, 'DAFTAR PROYEK', true);
  
  const projectData = projects.map((p, index) => [
    (index + 1).toString(),
    p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name,
    p.partner.length > 20 ? p.partner.substring(0, 20) + '...' : p.partner,
    getStatusLabel(p.status),
    formatCurrency(p.value),
    formatCurrency(p.paidAmount || 0),
    `${calculateProjectProgress(p)}%`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Nama Proyek', 'Partner', 'Status', 'Nilai', 'Terbayar', 'Progress']],
    body: projectData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 20, right: 20 },
    didDrawPage: function(data) {
      if (data.pageNumber > 1) {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 60, 'F');
        addHeader(doc, 'DAFTAR PROYEK (Lanjutan)', true);
      }
    }
  });
  
  // Add footer to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }
  
  // Save
  doc.save(`Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export new names alongside old names for backward compatibility
export const generateProjectReport = generateProjectPDF;
export const generateFinancialReport = generateFullReportPDF;

// New function for transaction report
export const generateTransactionReport = (transactions, filters = {}) => {
  const doc = new jsPDF('l'); // Landscape
  let yPos = addHeaderLandscape(doc, 'LAPORAN TRANSAKSI');
  
  // Filter info
  if (filters.dateRange) {
    doc.setFontSize(11);
    doc.text(
      `Periode: ${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`,
      148.5,
      yPos,
      { align: 'center' }
    );
    yPos += 10;
  }
  
  // Transaction table
  const tableData = transactions.map((t, index) => [
    (index + 1).toString(),
    formatDateShort(t.date),
    t.projectName && t.projectName.length > 30 ? t.projectName.substring(0, 30) + '...' : (t.projectName || '-'),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.category && t.category.length > 20 ? t.category.substring(0, 20) + '...' : (t.category || '-'),
    t.description && t.description.length > 50 ? t.description.substring(0, 50) + '...' : (t.description || '-'),
    t.type === 'income' ? formatCurrency(t.amount) : `(${formatCurrency(t.amount)})`
  ]);
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Add totals row
  tableData.push([
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    formatCurrency(totalIncome - totalExpense)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Tanggal', 'Proyek', 'Jenis', 'Kategori', 'Deskripsi', 'Jumlah']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 90 },
      6: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    didDrawPage: function(data) {
      if (data.pageNumber > 1) {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 297, 60, 'F');
        addHeaderLandscape(doc, 'LAPORAN TRANSAKSI (Lanjutan)', true);
      }
    },
    willDrawCell: function(data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });
  
  // Summary
  yPos = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total Pemasukan:', 200, yPos);
  doc.text(formatCurrency(totalIncome), 260, yPos, { align: 'right' });
  yPos += 6;
  doc.text('Total Pengeluaran:', 200, yPos);
  doc.text(formatCurrency(totalExpense), 260, yPos, { align: 'right' });
  yPos += 6;
  doc.setLineWidth(0.3);
  doc.line(200, yPos - 2, 260, yPos - 2);
  doc.text('Selisih:', 200, yPos + 3);
  doc.text(formatCurrency(totalIncome - totalExpense), 260, yPos + 3, { align: 'right' });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }
  
  // Save
  doc.save(`Laporan_Transaksi_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export all functions
export default {
  generateProjectPDF,
  generateProjectReport,
  generateInvoice,
  generateFinancialReport,
  generateFullReportPDF,
  generateTransactionReport
};