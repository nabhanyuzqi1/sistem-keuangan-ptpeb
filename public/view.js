// view.js

/**
 * =================================================================
 * VIEW
 * -----------------------------------------------------------------
 * Handles all DOM manipulations. It renders data provided by the
 * controller and communicates user actions back to the controller.
 * It does not know about the model or Firebase.
 * =================================================================
 */

const view = {
    // --- DOM SELECTORS ---
    elements: {
        mainContent: document.getElementById('mainContent'),
        modalContainer: document.getElementById('modalContainer'),
        loading: document.getElementById('loading'),
        navLinks: document.getElementById('nav-links'),
        alertContainer: document.getElementById('alertContainer'),
    },

    // --- UI Update Functions ---
    showLoading(show) {
        this.elements.loading.style.display = show ? 'flex' : 'none';
    },
    
    showAlert(message, type = 'error', duration = 4000) {
        this.elements.alertContainer.innerHTML = `
            <div class="custom-alert-overlay">
                <div class="custom-alert-box ${type}">
                    <p>${message}</p>
                    <button id="closeAlertButton">Tutup</button>
                </div>
            </div>
        `;
        document.getElementById('closeAlertButton').onclick = () => this.clearAlert();
        
        // Auto-dismiss
        setTimeout(() => this.clearAlert(), duration);
    },

    clearAlert() {
        this.elements.alertContainer.innerHTML = '';
    },

    updateNav(user, handlers) {
        let content = `
            <button onclick="controller.handleShowProjects()" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Proyek
            </button>
            <button onclick="controller.handleShowReports()" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Laporan
            </button>
        `;
        if (user) {
            content += `
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600 hidden md:inline">${user.displayName || user.email}</span>
                    <button onclick="controller.handleSignOut()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                        Keluar
                    </button>
                </div>`;
        } else {
            content += `
                <button onclick="controller.handleSignIn()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                    Login Admin
                </button>`;
        }
        this.elements.navLinks.innerHTML = content;
    },
    
    // --- PAGE/CONTENT RENDERING ---
    renderDashboard(projects, transactions, reminders) {
        const recentProjectsHtml = projects.length === 0 ? '<p class="text-gray-500 text-center">Belum ada proyek</p>' : 
            projects.map(p => `
                <div class="mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onclick="controller.handleShowProjectDetail('${p.id}')">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-semibold text-gray-800">${p.name}</h4>
                            <p class="text-sm text-gray-600">${p.partner}</p>
                            <p class="text-sm text-gray-500 mt-1">Nilai: ${this._formatCurrency(p.value)}</p>
                        </div>
                        <span class="status-badge status-${p.status}">${this._getStatusLabel(p.status)}</span>
                    </div>
                </div>
            `).join('');

        const recentTransactionsHtml = transactions.length === 0 ? '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Belum ada transaksi</td></tr>' :
            transactions.map(t => `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(t.date).toLocaleDateString('id-ID')}</td>
                    <td class="px-6 py-4 text-sm">${t.projectName || '-'}</td>
                    <td class="px-6 py-4 text-sm">${t.description}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'} font-medium">
                        ${t.type === 'income' ? '+' : '-'}${this._formatCurrency(t.amount)}
                    </td>
                </tr>
            `).join('');
            
        const remindersHtml = reminders.length > 0 ? `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-yellow-800 mb-2">⚠️ Deadline Proyek Mendekati</h3>
                ${reminders.map(p => {
                    const daysLeft = model.calculateDaysLeft(p.endDate);
                    return `<div class="mt-2"><p class="text-yellow-700"><strong>${p.name}</strong> - ${p.partner} <span class="text-red-600 font-bold ml-2">${daysLeft} hari lagi</span></p></div>`;
                }).join('')}
            </div>
            ` : '';

        this.elements.mainContent.innerHTML = `
            <div class="fade-in">
                <div class="mb-6"><h2 class="text-2xl font-bold text-gray-800">Dashboard Admin</h2></div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button onclick="controller.handleShowProjectModal()" class="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center">Tambah Proyek Baru</button>
                    <button onclick="controller.handleShowAITransactionModal()" class="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center">Input dengan AI (Screenshot)</button>
                    <button onclick="controller.handleShowTransactionModal()" class="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center">Input Manual</button>
                </div>
                <div id="projectReminders" class="mb-8">${remindersHtml}</div>
                <div class="bg-white rounded-lg shadow mb-8">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800">Proyek Terbaru</h3>
                        <button onclick="controller.handleShowProjects()" class="text-blue-600 hover:text-blue-800 text-sm">Lihat Semua →</button>
                    </div>
                    <div class="p-6">${recentProjectsHtml}</div>
                </div>
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200"><h3 class="text-lg font-semibold text-gray-800">Transaksi Terbaru</h3></div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyek</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th></tr></thead>
                            <tbody class="bg-white divide-y divide-gray-200">${recentTransactionsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    renderProjectsPage(projects, currentUser) {
        const projectsHtml = projects.length === 0 ? '<div class="col-span-full text-center py-8 text-gray-500">Belum ada proyek</div>' : 
            projects.map(project => {
                const progress = model.calculateProjectProgress(project);
                const daysLeft = model.calculateDaysLeft(project.endDate);
                return `
                    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onclick="controller.handleShowProjectDetail('${project.id}')">
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-4">
                                <h3 class="text-lg font-semibold text-gray-800">${project.name}</h3>
                                <span class="status-badge status-${project.status}">${this._getStatusLabel(project.status)}</span>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">${project.partner}</p>
                            <p class="text-sm text-gray-500 mb-4">${new Date(project.startDate).toLocaleDateString('id-ID')} - ${new Date(project.endDate).toLocaleDateString('id-ID')}</p>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm"><span>Nilai Proyek:</span><span class="font-semibold">${this._formatCurrency(project.value)}</span></div>
                                <div class="flex justify-between text-sm"><span>Pajak (${project.taxRate}%):</span><span>${this._formatCurrency(project.value * project.taxRate / 100)}</span></div>
                                <div class="flex justify-between text-sm"><span>Terbayar:</span><span class="text-green-600">${this._formatCurrency(project.paidAmount || 0)}</span></div>
                            </div>
                            <div class="mt-4">
                                <div class="flex justify-between text-sm mb-1"><span>Progress</span><span>${progress}%</span></div>
                                <div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div></div>
                            </div>
                            ${daysLeft > 0 && project.status === 'ongoing' ? `<p class="text-xs text-gray-500 mt-2">Sisa ${daysLeft} hari</p>` : ''}
                            <div class="mt-4 flex justify-end space-x-2">
                                <button onclick="event.stopPropagation(); controller.handleCopyProjectLink('${project.id}')" class="text-blue-600 hover:text-blue-800 text-sm">Salin Link</button>
                                ${currentUser ? `<button onclick="event.stopPropagation(); controller.handleShowProjectModal(${JSON.stringify(project).replace(/"/g, '&quot;')})" class="text-gray-600 hover:text-gray-800 text-sm">Edit</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        this.elements.mainContent.innerHTML = `
            <div class="fade-in">
                <div class="mb-6 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Daftar Proyek</h2>
                    ${currentUser ? `<button onclick="controller.handleShowProjectModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">+ Tambah Proyek</button>` : ''}
                </div>
                <div id="projectsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${projectsHtml}</div>
            </div>`;
    },

    renderProjectDetail(project, transactions, currentUser) {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        const transactionsHtml = transactions.length === 0 ? '<p class="text-gray-500 text-center">Belum ada transaksi untuk proyek ini</p>' : `
            <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-green-50 p-4 rounded-lg"><p class="text-sm text-green-600">Total Pemasukan</p><p class="text-xl font-bold text-green-700">${this._formatCurrency(income)}</p></div>
                <div class="bg-red-50 p-4 rounded-lg"><p class="text-sm text-red-600">Total Pengeluaran</p><p class="text-xl font-bold text-red-700">${this._formatCurrency(expense)}</p></div>
                <div class="bg-blue-50 p-4 rounded-lg"><p class="text-sm text-blue-600">Saldo</p><p class="text-xl font-bold text-blue-700">${this._formatCurrency(income - expense)}</p></div>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                            ${currentUser ? '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>' : ''}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${transactions.map(t => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(t.date).toLocaleString('id-ID')} ${t.isAIProcessed ? '<span class="ml-1 text-xs text-purple-600">(AI)</span>' : ''}</td>
                                <td class="px-6 py-4 text-sm">${t.description} ${t.imageUrl ? `<a href="${t.imageUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs block mt-1">Lihat Bukti</a>` : ''}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">${t.category}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'} font-medium">${t.type === 'income' ? '+' : '-'}${this._formatCurrency(t.amount)}</td>
                                ${currentUser ? `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onclick="controller.handleShowTransactionModal(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button><button onclick="controller.handleDeleteTransaction('${t.id}')" class="text-red-600 hover:text-red-900">Hapus</button></td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.elements.mainContent.innerHTML = `
            <div class="fade-in">
                <div class="mb-6">
                    <button onclick="controller.handleShowProjects()" class="text-blue-600 hover:text-blue-800 mb-4">← Kembali ke Daftar Proyek</button>
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">${project.name}</h2>
                            <p class="text-gray-600">${project.partner}</p>
                        </div>
                        <div class="flex space-x-2">
                           <button onclick="controller.handleShareWhatsApp('${project.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">WhatsApp</button>
                           <button onclick="controller.handleGeneratePDF('${project.id}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">PDF</button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow">
                         <h3 class="text-sm text-gray-600 mb-2">Informasi Proyek</h3>
                         <p class="text-xs text-gray-500">Status: <span class="status-badge status-${project.status}">${this._getStatusLabel(project.status)}</span></p>
                         <p class="text-xs text-gray-500 mt-2">Mulai: ${new Date(project.startDate).toLocaleDateString('id-ID')}</p>
                         <p class="text-xs text-gray-500">Selesai: ${new Date(project.endDate).toLocaleDateString('id-ID')}</p>
                         <p class="text-xs text-gray-500 mt-2">No. SPK/MOU: ${project.contractNumber || '-'}</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                         <h3 class="text-sm text-gray-600 mb-2">Nilai & Pembayaran</h3>
                         <p class="text-xs text-gray-500">Nilai: ${this._formatCurrency(project.value)}</p>
                         <p class="text-xs text-gray-500">Pajak (${project.taxRate}%): ${this._formatCurrency(project.value * project.taxRate / 100)}</p>
                         <p class="text-xs text-gray-500">Total: ${this._formatCurrency(project.value * (1 + project.taxRate / 100))}</p>
                         <p class="text-xs text-gray-500 mt-2">Terbayar: <span class="text-green-600 font-semibold">${this._formatCurrency(project.paidAmount || 0)}</span></p>
                         <p class="text-xs text-gray-500">Sisa: <span class="text-red-600 font-semibold">${this._formatCurrency(project.value - (project.paidAmount || 0))}</span></p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-sm text-gray-600 mb-2">Progress</h3>
                        <div class="w-full bg-gray-200 rounded-full h-4"><div class="bg-blue-600 h-4 rounded-full text-center text-white text-xs" style="width: ${model.calculateProjectProgress(project)}%">${model.calculateProjectProgress(project)}%</div></div>
                         ${project.status === 'ongoing' ? `<p class="text-xs text-gray-500 mt-2">Sisa waktu: ${model.calculateDaysLeft(project.endDate)} hari</p>` : ''}
                    </div>
                </div>
                ${currentUser ? `<div class="mb-6 flex justify-end"><button onclick="controller.handleShowTransactionModal(null, '${project.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">+ Tambah Transaksi</button></div>` : ''}
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200"><h3 class="text-lg font-semibold text-gray-800">Transaksi Proyek</h3></div>
                    <div id="projectTransactions" class="p-6">${transactionsHtml}</div>
                </div>
            </div>`;
    },

    // --- HELPER METHODS ---
    _formatCurrency(amount) {
        if (typeof amount !== 'number') return 'Rp 0';
        return 'Rp ' + amount.toLocaleString('id-ID');
    },

    _getStatusLabel(status) {
        const labels = {
            'akan-datang': 'Akan Datang',
            'ongoing': 'On Going',
            'retensi': 'Retensi',
            'selesai': 'Selesai'
        };
        return labels[status] || status;
    },
    
    // The functions to render Modals, Reports, and Charts are quite large.
    // They would be included here following the same pattern, taking data
    // from the controller and rendering HTML. For brevity, they are omitted
    // from this example but would be structured similarly to the above render functions.
};
