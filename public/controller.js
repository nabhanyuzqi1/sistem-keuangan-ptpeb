// controller.js

/**
 * =================================================================
 * CONTROLLER
 * -----------------------------------------------------------------
 * Acts as the intermediary between the Model and the View. It
 * handles user input, orchestrates the application flow, and
 * manages application state.
 * =================================================================
 */

const controller = {
    // --- INITIALIZATION ---
    init() {
        model.initFirebase();
        // The onAuthStateChanged listener in the model will handle UI updates
        // after authentication state changes.
        model.onAuthStateChanged((user, error) => {
            view.showLoading(false);
            view.updateNav(user, this.getNavHandlers());
            
            if (error === 'TIDAK_DIIZINKAN') {
                view.showAlert('Akses ditolak. Hanya admin yang dapat login.', 'error');
                this.handleShowProjects(); // Show public projects view
            } else if (user) {
                // If there's a project in the URL, go there, otherwise go to dashboard
                if (!this.checkUrlForProject()) {
                   this.handleShowDashboard();
                }
            } else {
                 // If there's a project in the URL, go there, otherwise go to project list
                if (!this.checkUrlForProject()) {
                    this.handleShowProjects();
                }
            }
        });
    },
    
    // Gets handlers for navigation buttons
    getNavHandlers() {
        return {
            showProjects: this.handleShowProjects.bind(this),
            showReports: this.handleShowReports.bind(this),
            signOut: this.handleSignOut.bind(this),
            signIn: this.handleSignIn.bind(this),
        };
    },
    
    checkUrlForProject() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');
        if (projectId) {
            // Use a timeout to ensure data has a chance to load first
            setTimeout(() => {
                this.handleShowProjectDetail(projectId);
            }, 500);
            return true; // Found a project in URL
        }
        return false; // No project in URL
    },

    // --- AUTHENTICATION HANDLERS ---
    async handleSignIn() {
        try {
            await model.signInWithGoogle();
            // The onAuthStateChanged listener will handle the success/failure logic
        } catch (error) {
            console.error('Sign in error:', error);
            view.showAlert('Gagal melakukan login: ' + error.message, 'error');
        }
    },

    async handleSignOut() {
        try {
            await model.signOut();
            window.history.pushState({}, "Projects", window.location.pathname); // Clear URL params on logout
            // onAuthStateChanged listener will redirect to the public view
        } catch (error) {
            console.error('Sign out error:', error);
            view.showAlert('Gagal melakukan logout: ' + error.message, 'error');
        }
    },
    
    // --- PAGE NAVIGATION HANDLERS ---
    async handleShowDashboard() {
        if (!model.state.currentUser) {
            this.handleShowProjects();
            return;
        }
        view.elements.mainContent.innerHTML = '<p class="text-center text-gray-500">Memuat dashboard...</p>';
        try {
            const projects = await model.getProjects(5);
            const transactions = await model.getTransactions(10);
            const ongoingProjects = projects.filter(p => p.status === 'ongoing');
            const reminders = ongoingProjects.filter(p => {
                const daysLeft = model.calculateDaysLeft(p.endDate);
                return daysLeft <= 30 && daysLeft > 0;
            });
            view.renderDashboard(projects, transactions, reminders, this.getDashboardHandlers());
        } catch (error) {
            console.error('Error loading dashboard:', error);
            view.showAlert('Gagal memuat dashboard.', 'error');
        }
    },
    
    async handleShowProjects() {
        model.state.currentProjectId = null;
        view.elements.mainContent.innerHTML = '<p class="text-center text-gray-500">Memuat proyek...</p>';
        try {
            const projects = await model.getProjects(); // Get all projects
            view.renderProjectsPage(projects, model.state.currentUser, this.getProjectsPageHandlers());
        } catch (error) {
            console.error('Error loading projects page:', error);
            view.showAlert('Gagal memuat daftar proyek.', 'error');
        }
    },

    async handleShowProjectDetail(projectId) {
        model.state.currentProjectId = projectId;
        view.elements.mainContent.innerHTML = `<p class="text-center text-gray-500">Memuat detail proyek...</p>`;
        try {
            // We need all projects for the dropdowns in modals
            await model.getProjects();
            const project = await model.getProject(projectId);

            if (!project) {
                view.showAlert('Proyek tidak ditemukan.', 'error');
                this.handleShowProjects();
                return;
            }
            const transactions = await model.getProjectTransactions(projectId);
            view.renderProjectDetail(project, transactions, model.state.currentUser, this.getProjectDetailHandlers(projectId));
            // After rendering, update the URL
            window.history.pushState({}, project.name, `?project=${projectId}`);
        } catch (error) {
            console.error('Error showing project detail:', error);
            view.showAlert('Gagal memuat detail proyek.', 'error');
        }
    },
    
     async handleShowReports() {
        view.elements.mainContent.innerHTML = '<p class="text-center text-gray-500">Memuat laporan...</p>';
        try {
            const projects = await model.getProjects();
            const transactions = await model.getTransactions();
            view.renderFullReport(projects, transactions);
        } catch (error) {
            console.error('Error loading reports:', error);
            view.showAlert('Gagal memuat laporan.', 'error');
        }
    },

    // --- MODAL & FORM HANDLERS ---
    handleShowProjectModal(project = null) {
        view.renderProjectModal(project, this.getFormHandlers());
    },

    async handleSaveProject(event, projectId) {
        event.preventDefault();
        view.setModalLoading(true);
        const form = event.target;
        const projectData = {
            name: form.projectName.value,
            partner: form.projectPartner.value,
            contractNumber: form.projectContractNumber.value,
            status: form.projectStatus.value,
            value: parseFloat(form.projectValue.value),
            taxRate: parseFloat(form.projectTaxRate.value),
            startDate: form.projectStartDate.value,
            endDate: form.projectEndDate.value,
            description: form.projectDescription.value,
        };

        try {
            await model.saveProject(projectData, projectId);
            view.showAlert(projectId ? 'Proyek berhasil diperbarui.' : 'Proyek berhasil ditambahkan.', 'success');
            view.closeModal();
            this.refreshCurrentView(true); // Force data refresh
        } catch (error) {
            console.error('Error saving project:', error);
            view.showAlert('Gagal menyimpan proyek: ' + error.message, 'error');
        } finally {
             view.setModalLoading(false);
        }
    },

    handleShowTransactionModal(transaction = null, projectId = null) {
        // If we don't have projects loaded yet, fetch them first.
        if (model.state.projects.length === 0) {
             model.getProjects().then(() => {
                view.renderTransactionModal(transaction, projectId, model.state.projects, this.getFormHandlers());
             });
        } else {
            view.renderTransactionModal(transaction, projectId, model.state.projects, this.getFormHandlers());
        }
    },

    async handleSaveTransaction(event, transactionId) {
        event.preventDefault();
        view.setModalLoading(true);
        const form = event.target;

        const transactionData = {
            projectId: form.transactionProjectId.value,
            date: form.transactionDate.value,
            type: form.transactionType.value,
            category: form.transactionCategory.value,
            amount: parseFloat(form.transactionAmount.value),
            description: form.transactionDescription.value,
        };

        try {
            await model.saveTransaction(transactionData, transactionId);
            view.showAlert(transactionId ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil ditambahkan.', 'success');
            view.closeModal();
            this.refreshCurrentView(true);
        } catch (error) {
            console.error('Error saving transaction:', error);
            view.showAlert('Gagal menyimpan transaksi: ' + error.message, 'error');
        } finally {
            view.setModalLoading(false);
        }
    },
    
    handleShowAITransactionModal() {
        if (model.state.projects.length === 0) {
             model.getProjects().then(() => {
                view.renderAITransactionModal(model.state.projects, this.getFormHandlers());
             });
        } else {
             view.renderAITransactionModal(model.state.projects, this.getFormHandlers());
        }
    },

    async handleProcessImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        view.setAIModalState('processing');
        try {
            const base64 = await model.fileToBase64(file);
            const imageUrl = await model.uploadFile(file);
            const aiData = await model.processImageWithAI(base64, file.type);
            
            view.populateAIForm(aiData, imageUrl);
            view.setAIModalState('result');
        } catch (error) {
            console.error('AI processing error:', error);
            view.showAlert('Gagal memproses gambar: ' + error.message, 'error');
            view.setAIModalState('upload');
        }
    },

    async handleSaveAITransaction(event) {
        event.preventDefault();
        view.setModalLoading(true);
        const form = event.target;
        
        const transactionData = {
            projectId: form.aiProjectId.value,
            date: form.aiTransactionDate.value,
            type: form.aiTransactionType.value,
            category: form.aiTransactionCategory.value,
            amount: parseFloat(form.aiTransactionAmount.value),
            description: form.aiTransactionDescription.value,
            imageUrl: document.getElementById('aiImagePreview').dataset.url,
            isAIProcessed: true,
        };
        
        try {
            // Here we pass null for transactionId because AI input is always for new transactions
            await model.saveTransaction(transactionData, null); 
            view.showAlert('Transaksi AI berhasil ditambahkan.', 'success');
            view.closeModal();
            this.refreshCurrentView(true);
        } catch (error) {
            console.error('Error saving AI transaction:', error);
            view.showAlert('Gagal menyimpan transaksi AI: ' + error.message, 'error');
        } finally {
            view.setModalLoading(false);
        }
    },

    // --- ACTION HANDLERS (PDF, WhatsApp, etc.) ---
    async handleDeleteTransaction(transactionId) {
        const confirmed = await view.showConfirmation('Apakah Anda yakin ingin menghapus transaksi ini?');
        if (!confirmed) return;
        
        view.showLoading(true);
        try {
            await model.deleteTransaction(transactionId);
            view.showAlert('Transaksi berhasil dihapus.', 'success');
            this.refreshCurrentView(true);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            view.showAlert('Gagal menghapus transaksi: ' + error.message, 'error');
        } finally {
            view.showLoading(false);
        }
    },
    
    async handleShareWhatsApp(projectId) {
        const project = await model.getProject(projectId);
        const transactions = await model.getProjectTransactions(projectId);
        view.shareViaWhatsApp(project, transactions);
    },

    async handleGeneratePDF(projectId) {
        view.showLoading(true);
        const project = await model.getProject(projectId);
        const transactions = await model.getProjectTransactions(projectId);
        try {
            await view.generateProjectPDF(project, transactions);
        } catch(error) {
            console.error("PDF Generation failed", error);
            view.showAlert("Gagal membuat PDF.", "error");
        } finally {
            view.showLoading(false);
        }
    },

    handleCopyProjectLink(projectId) {
        const link = `${window.location.origin}${window.location.pathname}?project=${projectId}`;
        navigator.clipboard.writeText(link).then(() => {
            view.showAlert('Link proyek berhasil disalin!', 'success');
        }, () => {
            view.showAlert('Gagal menyalin link.', 'error');
        });
    },

    // --- UTILITY AND HELPER METHODS ---
    async refreshCurrentView(forceDataReload = false) {
        view.showLoading(true);
        if (model.state.currentProjectId) {
            if(forceDataReload) await model.getProjects(); // reload all project data
            this.handleShowProjectDetail(model.state.currentProjectId);
        } else if (model.state.currentUser) {
            this.handleShowDashboard();
        } else {
            this.handleShowProjects();
        }
        view.showLoading(false);
    },
    
    // Bundles handlers for the view to avoid exposing the whole controller
    getDashboardHandlers() {
        return {
            showProjectModal: this.handleShowProjectModal.bind(this),
            showAITransactionModal: this.handleShowAITransactionModal.bind(this),
            showTransactionModal: this.handleShowTransactionModal.bind(this),
            showProjects: this.handleShowProjects.bind(this),
            showProjectDetail: this.handleShowProjectDetail.bind(this),
        };
    },

    getProjectsPageHandlers() {
        return {
            showProjectModal: this.handleShowProjectModal.bind(this),
            showProjectDetail: this.handleShowProjectDetail.bind(this),
            copyProjectLink: this.handleCopyProjectLink.bind(this),
        };
    },

    getProjectDetailHandlers(projectId) {
         return {
            showProjects: this.handleShowProjects.bind(this),
            shareWhatsApp: this.handleShareWhatsApp.bind(this),
            generatePDF: this.handleGeneratePDF.bind(this),
            showTransactionModal: this.handleShowTransactionModal.bind(this),
            showEditTransactionModal: (t) => this.handleShowTransactionModal(t, projectId),
            deleteTransaction: this.handleDeleteTransaction.bind(this),
         };
    },

    getFormHandlers() {
        return {
            saveProject: this.handleSaveProject.bind(this),
            saveTransaction: this.handleSaveTransaction.bind(this),
            processImage: this.handleProcessImage.bind(this),
            saveAITransaction: this.handleSaveAITransaction.bind(this),
            closeModal: view.closeModal.bind(view),
        };
    }
};

// --- START THE APP ---
document.addEventListener('DOMContentLoaded', () => {
    controller.init();
});
