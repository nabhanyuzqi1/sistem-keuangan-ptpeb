// model.js

/**
 * =================================================================
 * MODEL
 * -----------------------------------------------------------------
 * Handles all data and business logic. Interacts directly with
 * Firebase for data persistence. It knows nothing about the HTML or
 * the view.
 * =================================================================
 */

const model = {
    // Firebase Configuration
    firebaseConfig: {
        apiKey: "AIzaSyBQs36a-e61a-rQew10M1hhjhfode5nJ50", // Replace with your actual config
        authDomain: "sistem-keuangan-ptpeb.firebaseapp.com",
        projectId: "sistem-keuangan-ptpeb",
        storageBucket: "sistem-keuangan-ptpeb.firebasestorage.app",
        messagingSenderId: "700252927467",
        appId: "1:700252927467:web:987037067942cc9397d5ae",
        measurementId: "G-XR25JGC1NE"
    },
    // Gemini API Configuration
    GEMINI_API_KEY: "AIzaSyCXl-bqMtYmp4AuKEdLz1yDl0mzVmVIJXk", // Replace with your actual config
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent",

    // Firebase services
    auth: null,
    db: null,
    storage: null,

    // App State
    state: {
        currentUser: null,
        projects: [],
        transactions: [],
        currentProjectId: null,
        allowedAdminEmail: 'ptpermataenergiborneo@gmail.com'
    },

    // --- INITIALIZATION ---
    initFirebase() {
        firebase.initializeApp(this.firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.storage = firebase.storage();
    },

    // --- AUTHENTICATION ---
    onAuthStateChanged(callback) {
        this.auth.onAuthStateChanged(user => {
            if (user && user.email !== this.state.allowedAdminEmail) {
                // If user is logged in but not the allowed admin, force sign out.
                this.signOut();
                callback(null, 'TIDAK_DIIZINKAN'); // Pass null user and an error type
            } else {
                this.state.currentUser = user;
                callback(user, null); // Pass user and no error
            }
        });
    },

    signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        return this.auth.signInWithPopup(provider);
    },

    signOut() {
        return this.auth.signOut();
    },

    // --- DATA FETCHING (Firestore) ---
    async getProjects(limit = 0) {
        let query = this.db.collection('projects').orderBy('createdAt', 'desc');
        if (limit > 0) {
            query = query.limit(limit);
        }
        const snapshot = await query.get();
        this.state.projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return this.state.projects;
    },

    async getProject(projectId) {
        // First, check if the project is already in the local state
        let project = this.state.projects.find(p => p.id === projectId);
        if (project) return project;

        // If not, fetch from Firestore
        const doc = await this.db.collection('projects').doc(projectId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    },

    async getTransactions(limit = 0) {
        let query = this.db.collection('transactions').orderBy('date', 'desc');
        if (limit > 0) {
            query = query.limit(limit);
        }
        const snapshot = await query.get();
        this.state.transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return this.state.transactions;
    },
    
    async getProjectTransactions(projectId) {
        const snapshot = await this.db.collection('transactions')
            .where('projectId', '==', projectId)
            .orderBy('date', 'desc')
            .get();
        // This specifically fetches for a single project, so we don't overwrite the global transactions state
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },


    // --- DATA MUTATION (Firestore) ---
    async saveProject(projectData, projectId) {
        projectData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        projectData.userId = this.state.currentUser.uid;
        projectData.userEmail = this.state.currentUser.email;

        if (projectId) {
            return this.db.collection('projects').doc(projectId).update(projectData);
        } else {
            projectData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            projectData.paidAmount = 0; // Ensure new projects start with 0 paid
            return this.db.collection('projects').add(projectData);
        }
    },
    
    async saveTransaction(transactionData, transactionId) {
        transactionData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        transactionData.userId = this.state.currentUser.uid;
        transactionData.userEmail = this.state.currentUser.email;
        const project = this.state.projects.find(p => p.id === transactionData.projectId);
        transactionData.projectName = project ? project.name : 'N/A';
        
        // Handle edit logic for paid amount
        if (transactionId) {
             const oldTransaction = await this.db.collection('transactions').doc(transactionId).get();
             await this._updateProjectPaidAmountOnChange(oldTransaction.data(), transactionData, transactionData.amount);
             return this.db.collection('transactions').doc(transactionId).update(transactionData);
        } else {
             transactionData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
             await this._updateProjectPaidAmountOnAdd(transactionData);
             return this.db.collection('transactions').add(transactionData);
        }
    },
    
    async deleteTransaction(transactionId) {
        const transactionDoc = await this.db.collection('transactions').doc(transactionId).get();
        const transaction = transactionDoc.data();
        
        await this._updateProjectPaidAmountOnDelete(transaction);
        return this.db.collection('transactions').doc(transactionId).delete();
    },

    // --- Private Helper methods for updating project finances ---
    async _updateProjectPaidAmountOnAdd(newTransaction) {
        if (newTransaction.type === 'income' && newTransaction.projectId) {
            const projectRef = this.db.collection('projects').doc(newTransaction.projectId);
            await projectRef.update({
                paidAmount: firebase.firestore.FieldValue.increment(newTransaction.amount)
            });
        }
    },

    async _updateProjectPaidAmountOnDelete(deletedTransaction) {
        if (deletedTransaction.type === 'income' && deletedTransaction.projectId) {
            const projectRef = this.db.collection('projects').doc(deletedTransaction.projectId);
            await projectRef.update({
                paidAmount: firebase.firestore.FieldValue.increment(-deletedTransaction.amount)
            });
        }
    },

    async _updateProjectPaidAmountOnChange(oldTransaction, newTransactionData) {
        const projectRef = this.db.collection('projects').doc(oldTransaction.projectId);
        let amountChange = 0;

        // If it was income and now is not (or amount changed)
        if (oldTransaction.type === 'income') {
            amountChange -= oldTransaction.amount;
        }
        // If it is now income
        if (newTransactionData.type === 'income') {
            amountChange += newTransactionData.amount;
        }

        if (amountChange !== 0) {
            await projectRef.update({
                paidAmount: firebase.firestore.FieldValue.increment(amountChange)
            });
        }
    },


    // --- AI & STORAGE ---
    async uploadFile(file) {
        const imageName = `transactions/${Date.now()}_${file.name}`;
        const storageRef = this.storage.ref(imageName);
        await storageRef.put(file);
        return storageRef.getDownloadURL();
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    async processImageWithAI(base64, fileType) {
        const prompt = `Analisis screenshot WhatsApp ini dan ekstrak informasi transaksi keuangan. Identifikasi:
1. Tanggal dan waktu transaksi
2. Nominal uang (dalam Rupiah)
3. Jenis transaksi (pemasukan/pengeluaran)
4. Kategori yang sesuai:
   - Untuk pemasukan: Proyek, Pembayaran, Lainnya
   - Untuk pengeluaran: Operasional, Material, Upah Karyawan/Tukang, Pengeluaran Lain
5. Deskripsi transaksi
Format respons dalam JSON:
{
  "date": "YYYY-MM-DDTHH:mm",
  "amount": number,
  "type": "income" atau "expense",
  "category": "kategori yang sesuai",
  "description": "deskripsi transaksi"
}`;
        
        const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: fileType, data: base64.split(',')[1] } }
                    ]
                }],
                generationConfig: { temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 2048 }
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
            const aiText = data.candidates[0].content.parts[0].text;
            // Robust parsing of JSON from the response string
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        throw new Error('AI tidak dapat memproses gambar atau format respons tidak valid.');
    },

    // --- DATA HELPERS ---
    calculateProjectProgress(project) {
        if (!project || project.value === 0) return 0;
        return Math.round(((project.paidAmount || 0) / project.value) * 100);
    },

    calculateDaysLeft(endDate) {
        const end = new Date(endDate);
        const today = new Date();
        const diff = end - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },
};
