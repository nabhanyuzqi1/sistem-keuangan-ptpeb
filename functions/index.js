const functions = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
// **FIX:** Import `defineString` to handle environment variables in v2.
const {defineString} = require("firebase-functions/params");
const fetch = require("node-fetch");

// Updated model to gemini-2.0-flash as requested.
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// **FIX:** Define the environment variable using the modern v2 method.
// Firebase will look for this value in your .env files during deployment.
const geminiApiKey = defineString("GEMINI_API_KEY");

/**
 * A callable Cloud Function to analyze a transaction image using Gemini.
 * This function is called from the client-side code.
 */
exports.analyzeTransactionImageWithAI=onCall({cors: true}, async (request) => {
  // **FIX:** Get the value of the defined environment variable.
  // This replaces the deprecated functions.config().
  const apiKey = geminiApiKey.value();

  if (!apiKey) {
    logger.error(
        "Gemini API key is not configured in the environment.",
    );
    throw new functions.https.HttpsError(
        "failed-precondition",
        "The function is not configured correctly. Missing API Key.",
    );
  }

  logger.info("Received request data:", request.data);

  const {base64String, mimeType} = request.data;

  if (!base64String || !mimeType) {
    logger.error("Validation failed: 'base64String' or 'mimeType' is missing.",
        {
          hasBase64: !!base64String,
          hasMimeType: !!mimeType,
        });
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with 'base64String' and 'mimeType'.",
    );
  }

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Analisis screenshot transaksi keuangan ini & ekstrak info:
            INSTRUKSI PENTING:
            1. Ekstrak SEMUA informasi transaksi yang terlihat.
            2. Perhatikan format tanggal Indonesia (DD/MM/YYYY)
               Jika tidak ada, gunakan tanggal hari ini:
               ${new Date().toLocaleDateString("id-ID")}.
            3. Nominal harus dalam angka tanpa titik atau koma.
            4. Tentukan jenis transaksi (INCOME/EXPENSE) dari konteks:
               - INCOME: transfer masuk, terima, dari, received, CR, credit.
               - EXPENSE: transfer keluar, bayar, kirim, ke, sent, DB, debit.
            Kategori INCOME: ['Proyek', 'Pembayaran', 'Lainnya']
            Kategori EXPENSE: ['Operasional', 'Material', 'Upah', 'Lain']
            Berikan respons HANYA dalam format JSON yang valid,
            tanpa markdown.
            Jika tidak ada informasi yang dapat diekstrak,
            berikan respons JSON kosong.
            Format respons JSON:
            {
              "date": "2025-06-18T12:58:00", // Tanggal dalam format ISO
              "amount": 150000, // Nominal tanpa titik/koma
              "type": "income", // 'income' atau 'expense'
              "category": "Proyek", // Kategori sesuai jenis transaksi
              "description": "Pembayaran termin 1 proyek" // Deskripsi singkat
            }
            Contoh respons JSON:
            {
              "date": "2025-06-18T12:58:00",
              "amount": 150000,
              "type": "income",
              "category": "Proyek",
              "description": "Pembayaran termin 1 proyek"
            }
              atau jika bukan gambar transaksi:
              cari informasi yang relevan dari gambar ini.`,
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
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  logger.info("Sending request to Gemini API.");

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Gemini API request failed.", {
        status: response.status,
        body: errorBody,
      });
      throw new functions.https.HttpsError(
          "internal",
          `Gemini API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    logger.info("Successfully received response from Gemini API.");

    const aiResponseText = data.candidates[0].content.parts[0].text;
    return {data: aiResponseText};
  } catch (error) {
    logger.error("Error calling Gemini API:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
        "unknown",
        "An unexpected error occurred while analyzing the image.",
    );
  }
});
