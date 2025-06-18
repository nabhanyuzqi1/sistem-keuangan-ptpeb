import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { storage } from './firebase'; // Pastikan firebase.js Anda sudah diinisialisasi

// Fungsi helper untuk memvalidasi file gambar
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
  }

  if (file.size > maxSize) {
    throw new Error('Ukuran file terlalu besar. Maksimal 5MB.');
  }

  return true;
};

// Fungsi helper untuk mengubah file menjadi base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};


// --- ALUR ANALISIS AI YANG TELAH DIREFAKTOR ---

// 1. Fungsi untuk mengunggah gambar ke Firebase Storage
export const uploadTransactionImage = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `transactions/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Gambar diunggah ke Firebase Storage:', downloadURL);
    
    return {
      url: downloadURL,
      path: snapshot.metadata.fullPath,
    };
  } catch (error) {
    console.error('Kesalahan saat mengunggah gambar ke Firebase Storage:', error);
    throw new Error('Gagal mengunggah gambar. Silakan coba lagi.');
  }
};


// 2. Fungsi utama untuk menganalisis gambar transaksi
export const analyzeTransactionImage = async (file, userId) => {
  try {
    console.log('Memulai analisis AI untuk file:', file.name);

    // Langkah A: Validasi file di sisi klien terlebih dahulu
    validateImageFile(file);

    // Langkah B: Unggah ke Firebase Storage dan ubah ke base64 secara paralel
    const [uploadResult, base64Data] = await Promise.all([
      uploadTransactionImage(file, userId),
      fileToBase64(file),
    ]);
    
    const base64String = base64Data.split(',')[1];
    
    console.log('Gambar diunggah dan diubah ke base64. Memanggil Cloud Function...');

    // Langkah C: Panggil Firebase Cloud Function
    const functions = getFunctions();
    const analyzeFunction = httpsCallable(functions, 'analyzeTransactionImageWithAI');
    
    const response = await analyzeFunction({
      base64String: base64String,
      mimeType: file.type
    });
    
    console.log('Respons Cloud Function diterima:', response);

    // Langkah D: Proses respons dari Cloud Function
    // **PERBAIKAN:** Menggunakan JSON.parse() untuk mengubah respons string dari AI menjadi objek.
    // Respons dari onCall function terbungkus dalam objek 'data', jadi kita mengakses `response.data.data`.
    const aiResponseString = response.data.data;
    if (!aiResponseString) {
        throw new Error('AI tidak memberikan respons. Coba lagi.');
    }
    const parsedData = JSON.parse(aiResponseString);

    if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('AI tidak dapat menganalisis gambar. Pastikan gambar jelas dan berisi informasi transaksi.');
    }

    // Langkah E: Validasi dan format hasil akhir
    const now = new Date();
    const result = {
      date: parsedData.date || now.toISOString(),
      amount: Math.abs(Number(parsedData.amount)) || 0,
      type: (parsedData.type === 'income' || parsedData.type === 'expense') ? parsedData.type : 'expense',
      category: parsedData.category || (parsedData.type === 'income' ? 'Pembayaran' : 'Operasional'),
      description: parsedData.description || 'Transaksi dari screenshot',
      imageUrl: uploadResult.url, // URL dari hasil unggahan storage
      imagePath: uploadResult.path, // Path dari hasil unggahan storage
      isAIProcessed: true,
    };

    console.log('Hasil Akhir AI:', result);
    return result;

  } catch (error) {
    console.error('Kesalahan dalam analyzeTransactionImage:', error);
    // Memberikan pesan kesalahan yang lebih ramah pengguna
    const errorMessage = error.message || 'Terjadi kesalahan saat menganalisis gambar. Silakan coba lagi.';
    throw new Error(errorMessage);
  }
};
