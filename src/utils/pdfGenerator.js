// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import { formatCurrency, formatDate, getStatusLabel, calculateProjectProgress } from './formatters';

export const generateProjectPDF = (project, transactions) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('PT PERMATA ENERGI BORNEO', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('LAPORAN PROYEK', 105, 30, { align: 'center' });
  
  // Project Info
  doc.setFontSize(14);
  doc.text(project.name, 105, 45, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Mitra: ${project.partner}`, 20, 60);
  doc.text(`Status: ${getStatusLabel(project.status)}`, 20, 70);
  doc.text(`No. SPK/MOU: ${project.contractNumber || '-'}`, 20, 80);
  doc.text(`Periode: ${formatDate(project.startDate)} - ${formatDate(project.endDate)}`, 20, 90);
  
  // Financial Summary
  doc.setFontSize(14);
  doc.text('RINGKASAN KEUANGAN', 20, 110);
  
  doc.setFontSize(12);
  const totalValue = project.value * (1 + project.taxRate / 100);
  doc.text(`Nilai Proyek: ${formatCurrency(project.value)}`, 20, 125);
  doc.text(`Pajak (${project.taxRate}%): ${formatCurrency(project.value * project.taxRate / 100)}`, 20, 135);
  doc.text(`Total: ${formatCurrency(totalValue)}`, 20, 145);
  
  // Transaction Summary
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  doc.text(`Total Pemasukan: ${formatCurrency(income)}`, 20, 160);
  doc.text(`Total Pengeluaran: ${formatCurrency(expense)}`, 20, 170);
  doc.text(`Saldo: ${formatCurrency(income - expense)}`, 20, 180);
  doc.text(`Progress: ${calculateProjectProgress(project)}%`, 20, 190);
  
  // Transaction Details
  if (transactions.length > 0) {
    doc.setFontSize(14);
    doc.text('DETAIL TRANSAKSI', 20, 210);
    
    let yPos = 225;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(10);
    transactions.forEach((trans, index) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      const type = trans.type === 'income' ? 'Masuk' : 'Keluar';
      const amount = trans.type === 'income' ? 
        `+${formatCurrency(trans.amount)}` : 
        `-${formatCurrency(trans.amount)}`;
      
      doc.text(`${index + 1}. ${formatDate(trans.date)} - ${type}: ${amount}`, 25, yPos);
      doc.text(`   ${trans.description}`, 25, yPos + 5);
      doc.text(`   Kategori: ${trans.category}`, 25, yPos + 10);
      
      yPos += 20;
    });
  }
  
  // Footer
  doc.setFontSize(10);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      105,
      doc.internal.pageSize.height - 15,
      { align: 'center' }
    );
    doc.text(
      `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
      20,
      doc.internal.pageSize.height - 15
    );
  }
  
  // Save
  const fileName = `Laporan_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateFullReportPDF = (projects, transactions, stats) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('PT PERMATA ENERGI BORNEO', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('LAPORAN KEUANGAN KESELURUHAN', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Per tanggal: ${formatDate(new Date())}`, 105, 40, { align: 'center' });
  
  // Summary Statistics
  doc.setFontSize(14);
  doc.text('RINGKASAN', 20, 60);
  
  doc.setFontSize(12);
  doc.text(`Total Proyek: ${stats.totalProjects}`, 20, 75);
  doc.text(`Total Nilai Proyek: ${formatCurrency(stats.totalValue)}`, 20, 85);
  doc.text(`Total Terbayar: ${formatCurrency(stats.totalPaid)}`, 20, 95);
  doc.text(`Total Pengeluaran: ${formatCurrency(stats.totalExpense)}`, 20, 105);
  doc.text(`Keuntungan: ${formatCurrency(stats.totalProfit)}`, 20, 115);
  doc.text(`Margin: ${stats.margin}%`, 20, 125);
  
  // Project List
  doc.setFontSize(14);
  doc.text('DAFTAR PROYEK', 20, 145);
  
  let yPos = 160;
  doc.setFontSize(10);
  
  projects.forEach((project, index) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(
      `${index + 1}. ${project.name} - ${project.partner}`,
      25,
      yPos
    );
    doc.text(
      `   Status: ${getStatusLabel(project.status)}, Nilai: ${formatCurrency(project.value)}`,
      25,
      yPos + 5
    );
    
    yPos += 15;
  });
  
  // Save
  doc.save(`Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
};