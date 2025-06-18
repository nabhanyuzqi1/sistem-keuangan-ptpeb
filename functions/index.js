const functions = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
// Mengimpor 'defineString' untuk menangani variabel lingkungan di v2.
const {defineString} = require("firebase-functions/params");
const fetch = require("node-fetch");

// Model yang telah diperbarui ke gemini-2.0-flash sesuai permintaan.
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Mendefinisikan variabel lingkungan menggunakan metode v2 yang modern.
// Firebase akan mencari nilai ini di file .env Anda saat deployment.
const geminiApiKey = defineString("GEMINI_API_KEY");

/**
 * Cloud Function yang dapat dipanggil untuk menganalisis gambar transaksi menggunakan Gemini.
 * Fungsi ini dipanggil dari sisi klien.
 */
exports.analyzeTransactionImageWithAI = onCall({cors: true}, async (request) => {
  // Mengambil nilai variabel lingkungan yang telah didefinisikan.
  const apiKey = geminiApiKey.value();

  if (!apiKey) {
    logger.error("Kunci API Gemini tidak dikonfigurasi di lingkungan.");
    throw new functions.https.HttpsError(
        "failed-precondition",
        "Fungsi tidak dikonfigurasi dengan benar. Kunci API tidak ada.",
    );
  }

  logger.info("Menerima data permintaan:", request.data);

  const {base64String, mimeType} = request.data;

  if (!base64String || !mimeType) {
    logger.error("Validasi gagal: 'base64String' atau 'mimeType' tidak ada.", {
      hasBase64: !!base64String,
      hasMimeType: !!mimeType,
    });
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Fungsi harus dipanggil dengan argumen 'base64String' dan 'mimeType'.",
    );
  }

  // Prompt AI yang telah disempurnakan untuk menangani berbagai jenis dokumen.
  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Analisis gambar transaksi keuangan ini dan ekstrak informasi berikut. Gambar bisa berupa bukti transfer (misalnya, dari WhatsApp) atau dokumen penawaran/invoice.

            INSTRUKSI PENTING:
            1.  **Identifikasi Jenis Dokumen:** Apakah ini bukti transfer langsung atau dokumen penawaran/pembelian?
            2.  **Ekstrak Informasi Kunci:**
                * **Tanggal:** Cari format tanggal Indonesia (DD/MM/YYYY atau DD MMM YYYY). Jika tidak ada, gunakan tanggal hari ini: ${new Date().toLocaleDateString("id-ID")}.
                * **Nominal:** Ambil jumlah total. Jika ini adalah bukti transfer, ambil jumlah yang ditransfer. Jika ini penawaran, ambil "Total Price" atau "DP". Angka harus tanpa titik atau koma.
                * **Deskripsi:** Buat deskripsi singkat dan jelas. Untuk transfer, gunakan berita transfer (cth: "kayu kasau n papan"). Untuk penawaran, gunakan item utama (cth: "Pembelian Rumput Soccer Lokal").
            3.  **Tentukan Jenis Transaksi (INCOME/EXPENSE):**
                * **INCOME (Pemasukan):** Jika ada kata seperti "terima", "dari", "pembayaran masuk", "CR".
                * **EXPENSE (Pengeluaran):** Jika ada kata seperti "transfer keluar", "bayar", "kirim", "ke", "pembelian", "DB". Ini adalah default jika tidak yakin.
            4.  **Tentukan Kategori:**
                * **Kategori Pemasukan:** ['Proyek', 'Pembayaran', 'Lainnya']
                * **Kategori Pengeluaran:** ['Operasional', 'Material', 'Upah Karyawan/Tukang', 'Pengeluaran Lain'] (Contoh: "kayu" atau "rumput sintetis" masuk ke 'Material').

            Berikan respons HANYA dalam format JSON yang valid tanpa markdown atau penjelasan tambahan.
            Contoh Respons:
            {
              "date": "2025-06-18T13:28:38",
              "amount": 2400000,
              "type": "expense",
              "category": "Material",
              "description": "Pembayaran untuk kayu kasau n papan"
            }`,
        },
        {
          inlineData: {
            mime_type: mimeType,
            data: base64String,
          },
        },
      ],
    }],
    generationConfig: {
      temperature: 0.2,
      topK: 1,
      topP: 1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  logger.info("Mengirim permintaan ke Gemini API.");

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Permintaan Gemini API gagal.", {
        status: response.status,
        body: errorBody,
      });
      throw new functions.https.HttpsError(
          "internal",
          `Kesalahan Gemini API: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    logger.info("Berhasil menerima respons dari Gemini API.");

    const aiResponseText = data.candidates[0].content.parts[0].text;
    return {data: aiResponseText};
  } catch (error) {
    logger.error("Kesalahan saat memanggil Gemini API:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
        "unknown",
        "Terjadi kesalahan tak terduga saat menganalisis gambar.",
    );
  }
});
