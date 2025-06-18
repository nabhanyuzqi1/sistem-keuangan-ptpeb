// src/utils/sharing.js
import { formatCurrency, formatDate, getStatusLabel, calculateProjectProgress } from './formatters';

export const shareProjectWhatsApp = (project, transactions) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const message = `
*LAPORAN PROYEK*
*${project.name}*
Mitra: ${project.partner}

📊 *Status:* ${getStatusLabel(project.status)}
📅 *Periode:* ${formatDate(project.startDate)} - ${formatDate(project.endDate)}

💰 *Keuangan:*
• Nilai Proyek: ${formatCurrency(project.value)}
• Pajak (${project.taxRate}%): ${formatCurrency(project.value * project.taxRate / 100)}
• Total: ${formatCurrency(project.value * (1 + project.taxRate / 100))}

📈 *Transaksi:*
• Total Pemasukan: ${formatCurrency(income)}
• Total Pengeluaran: ${formatCurrency(expense)}
• Saldo: ${formatCurrency(income - expense)}

📊 *Progress:* ${calculateProjectProgress(project)}%

🔗 Link Detail: ${window.location.origin}/projects/${project.id}
  `.trim();
  
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

export const copyProjectLink = (projectId) => {
  const link = `${window.location.origin}/projects/${projectId}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(link)
      .then(() => {
        alert('Link proyek berhasil disalin!');
        return true;
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        // Fallback method
        return fallbackCopyTextToClipboard(link);
      });
  } else {
    // Fallback method for older browsers
    return fallbackCopyTextToClipboard(link);
  }
};

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      alert('Link proyek berhasil disalin!');
    } else {
      alert('Gagal menyalin link');
    }
    return successful;
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    alert('Gagal menyalin link');
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}