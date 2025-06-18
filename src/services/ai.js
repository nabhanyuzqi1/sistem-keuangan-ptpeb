import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { storage } from './firebase'; // Assuming you have firebase.js initialized

// Helper function to validate image file (no changes needed, but included for completeness)
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

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};


// --- REFACTORED AI ANALYSIS FLOW ---

// 1. Function to upload image to Firebase Storage (separated for clarity)
export const uploadTransactionImage = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `transactions/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Image uploaded to Firebase Storage:', downloadURL);
    
    return {
      url: downloadURL,
      path: snapshot.metadata.fullPath,
    };
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw new Error('Gagal mengupload gambar. Silakan coba lagi.');
  }
};


// 2. Main function to analyze the transaction image
export const analyzeTransactionImage = async (file, userId) => {
  try {
    console.log('Starting AI analysis for file:', file.name);

    // Step A: Validate the file on the client side first
    validateImageFile(file);

    // Step B: Upload to Firebase Storage and convert to base64 in parallel
    const [uploadResult, base64Data] = await Promise.all([
      uploadTransactionImage(file, userId),
      fileToBase64(file),
    ]);
    
    const base64String = base64Data.split(',')[1];
    
    console.log('Image uploaded and converted to base64. Calling Cloud Function...');

    // Step C: Call the Firebase Cloud Function
    const functions = getFunctions();
    const analyzeFunction = httpsCallable(functions, 'analyzeTransactionImageWithAI');
    
    const response = await analyzeFunction({
      base64String: base64String,
      mimeType: file.type
    });
    
    console.log('Cloud Function response received:', response);

    // Step D: Process the response from the Cloud Function
    // The `response.data.data` nesting is because callable functions wrap the return in a 'data' object.
    const parsedData = response.data.data; 

    if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('AI tidak dapat menganalisis gambar. Pastikan gambar jelas dan berisi informasi transaksi.');
    }

    // Step E: Validate and format the final result
    const now = new Date();
    const result = {
      date: parsedData.date || now.toISOString(),
      amount: Math.abs(Number(parsedData.amount)) || 0,
      type: (parsedData.type === 'income' || parsedData.type === 'expense') ? parsedData.type : 'expense',
      category: parsedData.category || (parsedData.type === 'income' ? 'Pembayaran' : 'Operasional'),
      description: parsedData.description || 'Transaksi dari screenshot',
      imageUrl: uploadResult.url, // URL from storage upload
      imagePath: uploadResult.path, // Path from storage upload
      isAIProcessed: true,
    };

    console.log('Final AI Result:', result);
    return result;

  } catch (error) {
    console.error('Error in analyzeTransactionImage:', error);
    // Provide a user-friendly error message
    const errorMessage = error.message || 'Terjadi kesalahan saat menganalisis gambar. Silakan coba lagi.';
    throw new Error(errorMessage);
  }
};
