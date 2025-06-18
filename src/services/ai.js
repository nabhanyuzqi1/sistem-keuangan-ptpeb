// src/services/ai.js
import { GEMINI_API_URL } from '../utils/constants';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export const analyzeTransactionImage = async (file) => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Prepare the request to Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analisis screenshot WhatsApp ini dan ekstrak informasi transaksi keuangan. 
              Identifikasi:
              1. Tanggal dan waktu transaksi (format: YYYY-MM-DDTHH:mm)
              2. Nominal uang (dalam Rupiah, hanya angka)
              3. Jenis transaksi (income untuk pemasukan, expense untuk pengeluaran)
              4. Kategori yang sesuai:
                 - Untuk income: Proyek, Pembayaran, Lainnya
                 - Untuk expense: Operasional, Material, Upah Karyawan/Tukang, Pengeluaran Lain
              5. Deskripsi transaksi (dalam bahasa Indonesia)
              
              Jika ada transfer masuk atau kata "terima", itu adalah income.
              Jika ada transfer keluar atau kata "bayar", itu adalah expense.
              
              Format respons dalam JSON yang valid:
              {
                  "date": "YYYY-MM-DDTHH:mm",
                  "amount": number,
                  "type": "income" atau "expense",
                  "category": "kategori yang sesuai",
                  "description": "deskripsi transaksi"
              }
              
              Pastikan JSON valid dan dapat di-parse.`
            },
            {
              inline_data: {
                mime_type: file.type,
                data: base64.split(',')[1]
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          
          // Validate and clean the data
          return {
            date: parsedData.date || new Date().toISOString().slice(0, 16),
            amount: Math.abs(parsedData.amount) || 0,
            type: parsedData.type || 'expense',
            category: parsedData.category || (parsedData.type === 'income' ? 'Pembayaran' : 'Operasional'),
            description: parsedData.description || 'Transaksi dari WhatsApp'
          };
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          throw new Error('AI tidak dapat memproses gambar dengan benar');
        }
      }
    }
    
    throw new Error('AI tidak dapat menganalisis gambar');
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};