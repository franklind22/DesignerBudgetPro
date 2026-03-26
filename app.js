// ============================================
// DESIGNER BUDGET PRO - APLICAÇÃO PRINCIPAL
// VERSÃO COM MÓDULOS CENTRALIZADOS
// ============================================

// NOTA: Este arquivo depende dos seguintes módulos (carregar antes):
// - js/core/utils.js (Utils, Utils.toast, Utils.colorUtils, Utils.escapeHtml, Utils.formatBRL, Utils.formatDate)
// - js/core/theme-manager.js (ThemeManager)
// - js/core/store.js (Store)
// - js/core/validators.js (Validators)
// - js/generators/pdf-generators.js (PDFGenerators)

// ============================================
// APLICAÇÃO PRINCIPAL
// ============================================

const app = {
    // Getters para acesso rápido aos dados do Store
    get settings() { return Store.state.settings; },
    get clients() { return Store.state.clients; },
    get services() { return Store.state.services; },
    get budgets() { return Store.state.budgets; },
    
    // Estado da aplicação
    currentBudgetId: null,
    isEditing: false,
    currentBudgetServices: [],
    currentBudgetFilter: { category: '', search: '' },
    dateFilterActive: false,
    filteredBudgets: [],
    clientSearchFilter: '',
    paletteMode: 'generator',
    currentBudgetPalettes: {},
    isLoggedIn: false,
    charts: {},
    focusMode: false,
    editingClientId: null,
    lastCalculatedRate: null,
    _initChartsTimeout: null,
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    
    init() {
    console.log('🚀 Inicializando Designer Budget Pro...');
    
    // Verificar autenticação com Auth0
    const isAuthenticated = Auth0.isAuthenticated();
    const userData = Auth0.getCurrentUser();
    
    if (!isAuthenticated || !userData) {
        console.log('❌ Usuário não autenticado, redirecionando para login...');
        // Prevenir loop com flag
        if (!sessionStorage.getItem('redirecting')) {
            sessionStorage.setItem('redirecting', 'true');
            setTimeout(() => {
                sessionStorage.removeItem('redirecting');
                window.location.href = 'login.html';
            }, 100);
        }
        return;
    }
    
    sessionStorage.removeItem('redirecting');
    console.log('✅ Usuário autenticado:', userData.email);
    
    // Inicializar gerenciador de tema
    ThemeManager.init();
    
    // Carregar dados do Store usando userId do Auth0
    const userId = userData.userId;
    
    Store.load(userId);
    this.isLoggedIn = true;
    
    // Atualizar nome do usuário no Store se não existir
    if (!Store.state.settings.name) {
        Store.state.settings.name = userData.name;
        Store.state.settings.email = userData.email;
        Store.save();
    }
    
    this.updateUIFromStore();
    
    // Determinar qual view mostrar
    let initialView = 'dashboard';
    const targetView = localStorage.getItem('dbp_target_view');
    
    if (targetView && ['dashboard', 'budgets', 'clients', 'services', 'settings', 'documents', 'profile'].includes(targetView)) {
        initialView = targetView;
        localStorage.removeItem('dbp_target_view');
    }
    
    // Navegar para a view inicial
    this.navigate(initialView);
    
    // Forçar atualização do dashboard
    if (initialView === 'dashboard') {
        setTimeout(() => {
            this.updateDashboard();
            this.renderGoals();
            this.renderBackupSection();
            this.updateAboutStats();
            this.syncCalculatorWithSettings();
        }, 100);
    }
    
    this.setupNavigation();
    this.setTodayDate();
    this.setupThemeToggle();
    this.setupEventListeners();
    this.loadNotifications();
    
    // Iniciar backup automático
    Store.startAutoBackup();
    setInterval(() => this.checkExpiringBudgets(), 3600000);
    
    // Inicializar calculadoras
    setTimeout(() => {
        this.calcHourlyRate();
        this.calcProjectPrice();
        if (this.isLoggedIn) {
            this.applySavedThemeIfAny();
            this.syncCalculatorWithSettings();
        }
    }, 500);
},
    
    // ============================================
    // EVENTOS E NAVEGAÇÃO
    // ============================================
    
    setupEventListeners() {
        document.addEventListener('storeUpdated', () => { this.updateDashboard(); });
        document.addEventListener('notificationAdded', () => { this.loadNotifications(); });
        document.addEventListener('notificationsUpdated', () => { this.loadNotifications(); });
        document.addEventListener('themeColorsChanged', () => { this.forceThemeUpdate(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.flex').forEach(modal => {
                    modal.classList.remove('flex');
                    modal.classList.add('hidden');
                });
            }
        });
    },
    
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.navigate(view);
            });
        });
    },
    
    setupThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                ThemeManager.toggleThemeMode();
            });
        }
    },
    
    navigate(view) {
    console.log('Navegando para:', view);
    
    // Verificar se está logado
    if (!this.isLoggedIn && view !== 'login') { 
        this.showLogin(); 
        return; 
    }
    
    // Esconder todas as mains
    document.querySelectorAll('main').forEach(m => { 
        m.classList.add('hidden'); 
        m.classList.remove('active'); 
    });
    
    // Atualizar botões de navegação
    document.querySelectorAll('.nav-btn').forEach(b => { 
        b.classList.remove('active', 'bg-primary', 'text-white'); 
        b.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300'); 
    });
    
    // Ativar botão correspondente
    const btn = document.querySelector(`.nav-btn[data-view="${view}"]`);
    if (btn) { 
        btn.classList.add('active', 'bg-primary', 'text-white'); 
        btn.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300'); 
    }
    
    // Mostrar a view correspondente
    const targetView = document.getElementById(view + '-view');
    if (targetView) { 
        targetView.classList.remove('hidden'); 
        targetView.classList.add('active'); 
        console.log(`✅ View ${view} ativada`);
    } else {
        console.warn(`⚠️ View ${view} não encontrada`);
    }
    
    // Renderizar conteúdo específico de cada view
    if (view === 'clients') {
        this.renderClients();
    }
    if (view === 'services') {
        this.renderServicesList();
    }
    if (view === 'budgets') {
        this.renderBudgetsList();
    }
    if (view === 'documents') {
        this.renderDocuments();
    }
    if (view === 'profile') {
        this.renderProfile();
    }
    if (view === 'settings') { 
        this.loadSettingsToForm(); 
        this.renderGoals(); 
        this.renderBackupSection(); 
        this.updateAboutStats(); 
    }
    if (view === 'dashboard') { 
        // ✅ FORÇAR ATUALIZAÇÃO DO DASHBOARD
        this.updateDashboard(); 
        // Garantir que os gráficos sejam inicializados
        setTimeout(() => this.initCharts(), 100);
        // Garantir que as metas sejam atualizadas
        this.renderGoals();
    }
},
    
    showLogin() {
    console.log('Mostrando tela de login...');
    
    // Esconder navegação
    const nav = document.querySelector('nav');
    if (nav) nav.classList.add('hidden');
    
    const userInfo = document.querySelector('.user-info');
    if (userInfo) userInfo.classList.add('hidden');
    
    const focusBtn = document.querySelector('.focus-mode-btn');
    if (focusBtn) focusBtn.classList.add('hidden');
    
    // Desativar botões de navegação
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Esconder todas as views
    document.querySelectorAll('main').forEach(m => { 
        m.classList.add('hidden'); 
        m.classList.remove('active'); 
    });
    
    // Mostrar login
    const loginView = document.getElementById('login-view');
    if (loginView) { 
        loginView.classList.remove('hidden'); 
        loginView.classList.add('active'); 
        console.log('✅ Tela de login exibida');
    }
},

submitLogin() {
    const name = document.getElementById('loginName')?.value.trim();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const isRegister = document.getElementById('loginRegister')?.checked;
    
    if (!email || !password) {
        Utils.toast.error('Preencha e-mail e senha');
        return;
    }
    
    if (!Validators.isValidEmail(email)) {
        Utils.toast.error('E-mail inválido');
        return;
    }
    
    const action = isRegister ? 'register' : 'login';
    
    Auth[action](email, password, name)
        .then(user => {
            // Carregar dados do Store
            Store.load(user.userId);
            
            // Atualizar informações do perfil
            Store.state.settings.name = user.name;
            Store.state.settings.email = user.email;
            Store.save();
            
            localStorage.setItem('dbp_last_user', user.userId);
            this.isLoggedIn = true;
            this.updateUIFromStore();
            
            Utils.toast.success(isRegister ? `Bem-vindo, ${user.name}! Conta criada com sucesso.` : `Bem-vindo de volta, ${user.name}!`);
            
            // Mostrar navegação
            const nav = document.querySelector('nav');
            if (nav) nav.classList.remove('hidden');
            
            const userInfo = document.querySelector('.user-info');
            if (userInfo) userInfo.classList.remove('hidden');
            
            const focusBtn = document.querySelector('.focus-mode-btn');
            if (focusBtn) focusBtn.classList.remove('hidden');
            
            // Navegar para o dashboard
            this.navigate('dashboard');
            
            // Forçar atualização
            setTimeout(() => {
                this.updateDashboard();
                this.renderGoals();
                this.renderBackupSection();
                this.updateAboutStats();
                this.syncCalculatorWithSettings();
            }, 100);
        })
        .catch(error => {
            Utils.toast.error(error.message);
        });
},

logout() {
    Auth.logout();
},
    
    updateUIFromStore() {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        if (userNameEl) userNameEl.textContent = this.settings.name || '';
        if (userAvatarEl) userAvatarEl.textContent = (this.settings.name || '').charAt(0).toUpperCase();
        this.applySavedThemeIfAny();
        this.loadNotifications();
    },
    
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('budget-date');
        if (dateInput) dateInput.value = today;
    },
    
    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) { 
            const msgEl = overlay.querySelector('.loading-message');
            if (msgEl) msgEl.textContent = message;
            overlay.classList.remove('hidden'); 
            overlay.classList.add('flex'); 
        }
    },
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) { 
            overlay.classList.add('hidden'); 
            overlay.classList.remove('flex'); 
        }
    },
    
    // ============================================
    // TEMA E CORES
    // ============================================
    
    applySavedThemeIfAny() {
        const preset = this.settings.themePreset;
        if (preset && preset.colors) {
            this.applyThemeColors(preset.colors);
            console.log('✅ Tema salvo aplicado:', preset);
        }
    },
    
    applyThemeColors(colors) {
        ThemeManager.setColors(colors);
        this.updateTailwindColors(colors);
    },
    
    updateTailwindColors(colors) {
        document.querySelectorAll('[class*="bg-primary"]').forEach(el => { 
            el.style.transition = 'background-color 0.3s ease'; 
        });
    },
    
    applyThemeFromSettings() {
        const baseEl = document.getElementById('settings-theme-base');
        const modelEl = document.getElementById('settings-theme-model');
        
        if (!baseEl || !modelEl) { 
            Utils.toast.error('Elementos de tema não encontrados'); 
            return; 
        }
        
        const base = baseEl.value || '#2d8a8a';
        const model = modelEl.value;
        const map = { 
            monochromatic: 'monocromatica', 
            analogous: 'analogica', 
            complementary: 'complementar', 
            triadic: 'triadica', 
            tetradic: 'tetradica' 
        };
        const key = map[model] || 'monocromatica';
        const models = Utils.colorUtils.generatePaletteModels(base);
        const palette = models[key] || [];
        const colors = { 
            primary: palette[0] || base, 
            secondary: palette[1] || '#FFFFFF', 
            warning: palette[2] || '#667eea', 
            bg: palette[3] || '#f9faf9' 
        };
        
        this.applyThemeColors(colors);
        this.settings.themePreset = { base, model: key, colors };
        Store.save();
        Utils.toast.success('Tema aplicado com sucesso!');
        setTimeout(() => { this.forceThemeUpdate(); }, 100);
    },
    
    forceThemeUpdate() {
        document.dispatchEvent(new CustomEvent('themeUpdated'));
        if (this.charts?.status) this.charts.status.update();
        if (this.charts?.revenue) this.charts.revenue.update();
    },
    
    toggleTheme() {
        const darkMode = document.getElementById('settingDarkMode');
        if (!darkMode) return;
        
        const isDark = darkMode.checked;
        ThemeManager.setThemeMode(isDark);
        this.settings.theme = isDark ? 'dark' : 'light';
        Store.save();
        
        setTimeout(() => {
            if (this.charts?.status) {
                this.charts.status.options.plugins.legend.labels.color = document.documentElement.classList.contains('dark') ? '#fff' : '#000';
                this.charts.status.update();
            }
        }, 100);
        
        Utils.toast.success(`Modo ${isDark ? 'escuro' : 'claro'} ativado`);
    },
    
    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        const btn = document.querySelector('.focus-mode-btn i');
        if (this.focusMode) {
            document.body.classList.add('focus-mode');
            if (btn) btn.className = 'fa-regular fa-eye-slash';
            Utils.toast.info('Modo foco ativado');
        } else {
            document.body.classList.remove('focus-mode');
            if (btn) btn.className = 'fa-regular fa-eye';
            Utils.toast.info('Modo foco desativado');
        }
    },
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    
    loadNotifications() {
        const notifications = Store.getNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        
        if (badge) {
            if (unreadCount > 0) { 
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount; 
                badge.classList.remove('hidden'); 
            } else { 
                badge.classList.add('hidden'); 
            }
        }
        this.renderNotifications(notifications);
    },
    
    renderNotifications(notifications) {
        const list = document.getElementById('notifications-list');
        if (!list) return;
        
        if (notifications.length === 0) {
            list.innerHTML = `<div class="p-4 text-center text-gray-500 dark:text-gray-400">
                <i class="fa-regular fa-bell-slash text-2xl mb-2"></i>
                <p class="text-sm">Nenhuma notificação</p>
            </div>`;
            return;
        }
        
        list.innerHTML = notifications.slice(0, 10).map(n => `
            <div class="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}">
                <div class="flex items-start gap-3">
                    <i class="fa-solid ${n.type === 'success' ? 'fa-circle-check text-green-500' : n.type === 'warning' ? 'fa-triangle-exclamation text-yellow-500' : 'fa-circle-info text-blue-500'} mt-1"></i>
                    <div class="flex-1">
                        <p class="text-sm font-medium">${n.title}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${n.message}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${new Date(n.date).toLocaleDateString('pt-BR')} às ${new Date(n.date).toLocaleTimeString('pt-BR')}</p>
                    </div>
                    ${!n.read ? `<button onclick="Store.markNotificationAsRead(${n.id})" class="text-xs text-primary hover:underline">Marcar como lida</button>` : ''}
                </div>
            </div>
        `).join('');
    },
    
    toggleNotifications() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) dropdown.classList.toggle('hidden');
    },
    
    markAllNotificationsAsRead() {
        Store.markAllNotificationsAsRead();
        Utils.toast.success('Todas as notificações marcadas como lidas');
    },
    
    checkExpiringBudgets() {
        const notifications = Store.checkExpiringBudgets();
        notifications.forEach(notif => {
            Store.addNotification(notif);
        });
    },
    
    // ============================================
    // METAS
    // ============================================
    
    renderGoals() {
        const container = document.getElementById('goals-container');
        if (!container) return;
        
        if (!this.settings.goals) {
            this.settings.goals = {
                monthly: 50000,
                yearly: 600000,
                projectsPerMonth: 10
            };
            Store.save();
        }
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = this.budgets
            .filter(b => {
                const date = new Date(b.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, b) => sum + (b.total || 0), 0);
        
        const yearlyRevenue = this.budgets
            .filter(b => new Date(b.date).getFullYear() === currentYear)
            .reduce((sum, b) => sum + (b.total || 0), 0);
        
        const monthlyProgress = (monthlyRevenue / this.settings.goals.monthly) * 100;
        const yearlyProgress = (yearlyRevenue / this.settings.goals.yearly) * 100;
        const projectsThisMonth = this.budgets.filter(b => {
            const date = new Date(b.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-bullseye text-primary"></i>
                    Metas e Acompanhamento
                </h3>
                <button onclick="app.editGoals()" class="text-sm text-primary hover:underline flex items-center gap-1">
                    <i class="fa-solid fa-pen"></i> Editar metas
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Meta Mensal</span>
                        <span class="text-sm font-medium">${Math.min(monthlyProgress, 100).toFixed(1)}%</span>
                    </div>
                    <div class="text-2xl font-bold mb-1">R$ ${monthlyRevenue.toLocaleString('pt-BR')}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">de R$ ${this.settings.goals.monthly.toLocaleString('pt-BR')}</div>
                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: ${Math.min(monthlyProgress, 100)}%"></div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Meta Anual</span>
                        <span class="text-sm font-medium">${Math.min(yearlyProgress, 100).toFixed(1)}%</span>
                    </div>
                    <div class="text-2xl font-bold mb-1">R$ ${yearlyRevenue.toLocaleString('pt-BR')}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">de R$ ${this.settings.goals.yearly.toLocaleString('pt-BR')}</div>
                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: ${Math.min(yearlyProgress, 100)}%"></div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Projetos/Mês</span>
                        <span class="text-sm font-medium">${Math.min((projectsThisMonth / this.settings.goals.projectsPerMonth) * 100, 100).toFixed(1)}%</span>
                    </div>
                    <div class="text-2xl font-bold mb-1">${projectsThisMonth}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">de ${this.settings.goals.projectsPerMonth} projetos</div>
                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: ${Math.min((projectsThisMonth / this.settings.goals.projectsPerMonth) * 100, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    },
    
    editGoals() {
        if (!this.settings.goals) {
            this.settings.goals = {
                monthly: 50000,
                yearly: 600000,
                projectsPerMonth: 10
            };
            Store.save();
        }
        
        const monthlyInput = document.getElementById('goal-monthly');
        const yearlyInput = document.getElementById('goal-yearly');
        const projectsInput = document.getElementById('goal-projects');
        
        if (monthlyInput) monthlyInput.value = this.settings.goals.monthly;
        if (yearlyInput) yearlyInput.value = this.settings.goals.yearly;
        if (projectsInput) projectsInput.value = this.settings.goals.projectsPerMonth;
        
        this.openModal('goals-modal');
    },
    
    saveGoals() {
        const monthly = parseInt(document.getElementById('goal-monthly')?.value) || 50000;
        const yearly = parseInt(document.getElementById('goal-yearly')?.value) || 600000;
        const projects = parseInt(document.getElementById('goal-projects')?.value) || 10;
        
        if (!this.settings.goals) {
            this.settings.goals = {};
        }
        
        this.settings.goals.monthly = monthly;
        this.settings.goals.yearly = yearly;
        this.settings.goals.projectsPerMonth = projects;
        Store.save();
        
        this.closeModal('goals-modal');
        this.renderGoals();
        Utils.toast.success('Metas atualizadas com sucesso!');
    },
    
    // ============================================
    // BACKUP E DADOS
    // ============================================
    
    renderBackupSection() {
        const container = document.getElementById('backup-container');
        if (!container) return;
        
        const backups = Store.getBackups();
        const lastBackup = backups[backups.length - 1];
        const lastBackupInfo = lastBackup ? 
            `<div class="flex items-center gap-2 text-xs text-gray-500">
                <i class="fa-regular fa-clock"></i>
                <span>Último backup: ${new Date(lastBackup.timestamp).toLocaleDateString('pt-BR')} às ${new Date(lastBackup.timestamp).toLocaleTimeString('pt-BR')}</span>
            </div>` : '';
        
        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <h3 class="text-lg font-semibold flex items-center gap-2">
                            <i class="fa-solid fa-database text-primary"></i>
                            Backup e Restauração
                        </h3>
                        ${lastBackupInfo}
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Proteja seus dados com backup automático</p>
                </div>
                <div class="p-6">
                    <div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-check-circle text-green-500 text-sm"></i>
                            <span class="text-xs text-green-700 dark:text-green-400">Backup automático ativo</span>
                        </div>
                        <div class="flex items-center gap-1 text-xs text-gray-500">
                            <i class="fa-regular fa-clock"></i>
                            <span>A cada 5 minutos</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <button onclick="app.exportData()" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                            <i class="fa-solid fa-download text-sm"></i>
                            <span class="text-sm font-medium">Exportar Dados</span>
                        </button>
                        
                        <label class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                            <i class="fa-solid fa-upload text-sm"></i>
                            <span class="text-sm font-medium">Importar Dados</span>
                            <input type="file" accept=".json" onchange="app.importData(this.files[0])" class="hidden">
                        </label>
                    </div>
                    
                    <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-circle-info text-primary text-xs"></i>
                            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Informações:</span>
                        </div>
                        <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div class="flex items-center gap-2">
                                <i class="fa-regular fa-file-code w-4"></i>
                                <span>Exporta todos os dados: clientes, serviços, orçamentos e configurações</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fa-regular fa-clock w-4"></i>
                                <span>Backups automáticos mantêm histórico das últimas 20 versões</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fa-regular fa-folder-open w-4"></i>
                                <span>Arquivo exportado no formato JSON compatível com o sistema</span>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="app.showBackupHistory()" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors border-t border-gray-200 dark:border-gray-700 pt-4">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <span>Ver histórico de backups automáticos</span>
                        <i class="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    exportData() {
        const data = { 
            version: '3.0', 
            exportDate: new Date().toISOString(), 
            settings: this.settings, 
            clients: this.clients, 
            services: this.services, 
            budgets: this.budgets 
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `designer_budget_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.toast.success('Dados exportados com sucesso!');
    },
    
    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.version && data.exportDate) {
                    Store.state.settings = { ...Store.state.settings, ...data.settings };
                    Store.state.clients = data.clients || [];
                    Store.state.services = data.services || [];
                    Store.state.budgets = data.budgets || [];
                    Store.save();
                    
                    Utils.toast.success('Dados importados com sucesso!');
                    this.renderClients();
                    this.renderServicesList();
                    this.renderBudgetsList();
                    this.updateDashboard();
                    this.renderGoals();
                } else { 
                    Utils.toast.error('Arquivo inválido'); 
                }
            } catch (error) { 
                Utils.toast.error('Erro ao importar arquivo'); 
            }
        };
        reader.readAsText(file);
    },
    
    showBackupHistory() {
        const backups = Store.getBackups();
        const list = document.getElementById('backup-history-list');
        if (!list) return;
        
        if (backups.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fa-solid fa-database text-3xl mb-2 opacity-50"></i>
                    <p>Nenhum backup automático encontrado</p>
                    <p class="text-sm mt-2">Os backups são criados automaticamente a cada 5 minutos</p>
                </div>
            `;
        } else {
            list.innerHTML = backups.slice().reverse().map(b => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                        <p class="text-sm font-medium">Backup de ${new Date(b.timestamp).toLocaleDateString('pt-BR')}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(b.timestamp).toLocaleTimeString('pt-BR')}</p>
                        <p class="text-xs text-gray-500 mt-1">${Object.keys(b.data).length} coleções • ${b.data.clients?.length || 0} clientes • ${b.data.budgets?.length || 0} orçamentos</p>
                    </div>
                    <button onclick="app.restoreBackup('${b.timestamp}')" class="px-3 py-1 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors">Restaurar</button>
                </div>
            `).join('');
        }
        this.openModal('backup-modal');
    },
    
    restoreBackup(timestamp) {
        if (confirm('Restaurar este backup? Os dados atuais serão substituídos.')) {
            if (Store.restoreBackup(timestamp)) {
                Utils.toast.success('Backup restaurado com sucesso!');
                this.updateUIFromStore();
                this.renderClients();
                this.renderServicesList();
                this.renderBudgetsList();
                this.updateDashboard();
                this.renderGoals();
                this.closeModal('backup-modal');
            } else { 
                Utils.toast.error('Erro ao restaurar backup'); 
            }
        }
    },
    
    // ============================================
    // CALCULADORA
    // ============================================
    
    switchCalcTab(tab) {
        const hourlyTab = document.getElementById('calc-tab-hourly');
        const projectTab = document.getElementById('calc-tab-project');
        const btnHourly = document.getElementById('tab-hourly');
        const btnProject = document.getElementById('tab-project');
        
        if (!hourlyTab || !projectTab || !btnHourly || !btnProject) return;
        
        if (tab === 'hourly') {
            hourlyTab.classList.remove('hidden');
            projectTab.classList.add('hidden');
            btnHourly.classList.add('border-primary', 'text-primary');
            btnHourly.classList.remove('border-transparent', 'text-gray-500');
            btnProject.classList.remove('border-primary', 'text-primary');
            btnProject.classList.add('border-transparent', 'text-gray-500');
        } else {
            hourlyTab.classList.add('hidden');
            projectTab.classList.remove('hidden');
            btnProject.classList.add('border-primary', 'text-primary');
            btnProject.classList.remove('border-transparent', 'text-gray-500');
            btnHourly.classList.remove('border-primary', 'text-primary');
            btnHourly.classList.add('border-transparent', 'text-gray-500');
        }
    },
    
    calcHourlyRate() {
        const monthlyIncomeEl = document.getElementById('calc-monthly-income');
        const hoursPerDayEl = document.getElementById('calc-hours-per-day');
        const daysPerWeekEl = document.getElementById('calc-days-per-week');
        const vacationWeeksEl = document.getElementById('calc-vacation-weeks');
        const weeksYearEl = document.getElementById('calc-weeks-year');
        const hoursYearEl = document.getElementById('calc-hours-year');
        const annualIncomeEl = document.getElementById('calc-annual-income');
        const hourlyRateEl = document.getElementById('calc-hourly-rate');
        
        if (!monthlyIncomeEl || !hoursPerDayEl || !daysPerWeekEl || !vacationWeeksEl) {
            return 150;
        }
        
        const monthlyIncome = parseFloat(monthlyIncomeEl.value) || 5000;
        const hoursPerDay = parseFloat(hoursPerDayEl.value) || 8;
        const daysPerWeek = parseInt(daysPerWeekEl.value) || 5;
        const vacationWeeks = parseInt(vacationWeeksEl.value) || 4;
        const weeksPerYear = 52 - vacationWeeks;
        const hoursPerYear = weeksPerYear * daysPerWeek * hoursPerDay;
        const annualIncome = monthlyIncome * 12;
        const hourlyRate = annualIncome / hoursPerYear;
        
        if (weeksYearEl) weeksYearEl.textContent = weeksPerYear;
        if (hoursYearEl) hoursYearEl.textContent = hoursPerYear.toFixed(0) + 'h';
        if (annualIncomeEl) annualIncomeEl.textContent = 'R$ ' + annualIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        if (hourlyRateEl) hourlyRateEl.textContent = 'R$ ' + hourlyRate.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        
        this.lastCalculatedRate = hourlyRate;
        Utils.toast.success('Valor/hora calculado: R$ ' + hourlyRate.toFixed(2));
        return hourlyRate;
    },
    
    applyCalculatedHourlyRate() {
        if (!this.lastCalculatedRate) { 
            this.lastCalculatedRate = this.calcHourlyRate(); 
        }
        
        const rate = this.lastCalculatedRate;
        this.settings.hourlyRate = Math.round(rate);
        
        const settingInput = document.getElementById('settingHourlyRate');
        if (settingInput) settingInput.value = Math.round(rate);
        Store.save();
        
        Utils.toast.success('Valor/hora aplicado: R$ ' + rate.toFixed(2));
        
        const budgetHourly = document.getElementById('budget-hourly');
        if (budgetHourly) { 
            budgetHourly.value = Math.round(rate); 
            this.updateBudgetTotal(); 
        }
    },

    applyManualHourlyRate() {
        const manualInput = document.getElementById('calc-hourly-manual');
        if (!manualInput) return;
        
        const rate = parseFloat(manualInput.value) || 150;
        this.settings.hourlyRate = Math.round(rate);
        
        const settingInput = document.getElementById('settingHourlyRate');
        if (settingInput) settingInput.value = Math.round(rate);
        Store.save();
        
        Utils.toast.success('Valor/hora manual aplicado: R$ ' + rate.toFixed(2));
        
        const budgetHourly = document.getElementById('budget-hourly');
        if (budgetHourly) { 
            budgetHourly.value = Math.round(rate); 
            this.updateBudgetTotal(); 
        }
    },
    
    calcProjectPrice() {
        const hourlyRateEl = document.getElementById('calc-project-hourly');
        const hoursPerDayEl = document.getElementById('calc-project-hours-day');
        const projectDaysEl = document.getElementById('calc-project-days');
        const totalHoursEl = document.getElementById('calc-project-total-hours');
        const hourlyDisplayEl = document.getElementById('calc-project-hourly-display');
        const totalEl = document.getElementById('calc-project-total');
        
        if (!hourlyRateEl || !hoursPerDayEl || !projectDaysEl) {
            return 0;
        }
        
        const hourlyRate = parseFloat(hourlyRateEl.value) || 150;
        const hoursPerDay = parseFloat(hoursPerDayEl.value) || 8;
        const projectDays = parseInt(projectDaysEl.value) || 5;
        const totalHours = hoursPerDay * projectDays;
        const totalPrice = totalHours * hourlyRate;
        
        if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1) + 'h';
        if (hourlyDisplayEl) hourlyDisplayEl.textContent = 'R$ ' + hourlyRate.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        if (totalEl) totalEl.textContent = 'R$ ' + totalPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        
        return totalPrice;
    },
    
    syncCalculatorWithSettings() {
        const projectInput = document.getElementById('calc-project-hourly');
        if (!projectInput) return;
        
        const settingRate = this.settings.hourlyRate || 150;
        projectInput.value = settingRate;
        this.calcProjectPrice();
    },
    
    // ============================================
    // DASHBOARD
    // ============================================
    
    updateDashboard() {
    console.log('Atualizando dashboard...');
    
    // Usar orçamentos filtrados ou todos
    const budgets = this.dateFilterActive ? this.filteredBudgets : this.budgets;
    
    // Calcular estatísticas
    const total = budgets.length;
    const revenue = budgets.reduce((sum, b) => sum + (b.total || 0), 0);
    const paid = budgets.filter(b => b.status === 'pago').reduce((sum, b) => sum + (b.total || 0), 0);
    
    // Atualizar elementos do DOM
    const totalEl = document.getElementById('stat-total');
    const revenueEl = document.getElementById('stat-revenue');
    const receiptEl = document.getElementById('stat-receipt');
    
    if (totalEl) totalEl.textContent = total;
    if (revenueEl) revenueEl.textContent = 'R$ ' + revenue.toFixed(2).replace('.', ',');
    if (receiptEl) receiptEl.textContent = 'R$ ' + paid.toFixed(2).replace('.', ',');
    
    // Contagem por status
    const statusCounts = {
        em_processo: budgets.filter(b => b.status === 'em_processo').length,
        aprovado: budgets.filter(b => b.status === 'aprovado').length,
        nao_aprovado: budgets.filter(b => b.status === 'nao_aprovado').length,
        alterado: budgets.filter(b => b.status === 'alterado').length,
        concluido: budgets.filter(b => b.status === 'concluido').length,
        pago: budgets.filter(b => b.status === 'pago').length
    };
    
    // Atualizar cards de status
    const emProcessoEl = document.getElementById('stat-em-processo');
    const aprovadoEl = document.getElementById('stat-aprovado');
    const naoAprovadoEl = document.getElementById('stat-nao-aprovado');
    const alteradoEl = document.getElementById('stat-alterado');
    const concluidoEl = document.getElementById('stat-concluido');
    const pagoEl = document.getElementById('stat-pago');
    
    if (emProcessoEl) emProcessoEl.textContent = statusCounts.em_processo;
    if (aprovadoEl) aprovadoEl.textContent = statusCounts.aprovado;
    if (naoAprovadoEl) naoAprovadoEl.textContent = statusCounts.nao_aprovado;
    if (alteradoEl) alteradoEl.textContent = statusCounts.alterado;
    if (concluidoEl) concluidoEl.textContent = statusCounts.concluido;
    if (pagoEl) pagoEl.textContent = statusCounts.pago;
    
    // Renderizar últimos orçamentos
    this.renderRecentBudgets(budgets);
    
    // Inicializar gráficos
    this.initCharts();
    
    console.log('✅ Dashboard atualizado');
},
    
    renderRecentBudgets(budgets) {
    const recentList = document.getElementById('recent-budgets-list');
    const recentEmpty = document.getElementById('recent-budgets-empty');
    
    if (!recentList || !recentEmpty) {
        console.warn('Elementos de lista de orçamentos não encontrados');
        return;
    }
    
    // Pegar os 5 últimos orçamentos (mais recentes primeiro)
    const recent = [...budgets].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recent.length === 0) {
        recentList.innerHTML = '';
        recentEmpty.classList.remove('hidden');
        console.log('Nenhum orçamento recente');
    } else {
        recentEmpty.classList.add('hidden');
        recentList.innerHTML = recent.map(b => {
            const statusClass = {
                'em_processo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                'aprovado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                'nao_aprovado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                'alterado': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                'concluido': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                'pago': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            }[b.status] || 'bg-gray-100 text-gray-800';
            
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium truncate">${Utils.escapeHtml(b.clientName || 'Cliente')}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">${b.docNumber || '#' + String(b.id).slice(-4)}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>R$ ${(b.total || 0).toFixed(2).replace('.', ',')}</span>
                            <span>•</span>
                            <span>${b.services?.length || 0} serviços</span>
                            <span>•</span>
                            <span><i class="fa-regular fa-calendar mr-1"></i>${b.date || '—'}</span>
                        </div>
                    </div>
                    <span class="ml-4 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusClass}">
                        ${this.getStatusLabel(b.status)}
                    </span>
                </div>
            `;
        }).join('');
        
        console.log(`✅ ${recent.length} orçamentos recentes exibidos`);
    }
},
    
    filterDashboardByDate() {
        const from = document.getElementById('dashboard-date-from')?.value;
        const to = document.getElementById('dashboard-date-to')?.value;
        
        if (!from || !to) { 
            Utils.toast.error('Selecione ambas as datas'); 
            return; 
        }
        
        this.dateFilterActive = true;
        this.filteredBudgets = this.budgets.filter(b => { 
            const date = new Date(b.date); 
            return date >= new Date(from) && date <= new Date(to); 
        });
        
        this.updateDashboard();
        Utils.toast.success(`Filtro aplicado: ${this.filteredBudgets.length} orçamentos`);
    },
    
    clearDateFilter() {
        this.dateFilterActive = false;
        this.filteredBudgets = [];
        
        const fromEl = document.getElementById('dashboard-date-from');
        const toEl = document.getElementById('dashboard-date-to');
        
        if (fromEl) fromEl.value = '';
        if (toEl) toEl.value = '';
        
        this.updateDashboard();
    },
    
    filterByStatus(status) {
        const filterEl = document.getElementById('budget-filter-status');
        if (filterEl) { 
            filterEl.value = status; 
            this.navigate('budgets'); 
            setTimeout(() => this.filterBudgetsByStatus(), 100); 
        }
    },
    
    // ============================================
    // GRÁFICOS
    // ============================================
    
    initCharts() {
        const statusCanvas = document.getElementById('statusChart');
        const revenueCanvas = document.getElementById('revenueChart');
        
        if (!statusCanvas || !revenueCanvas) {
            console.log('Elementos de gráfico não encontrados nesta página');
            return;
        }
        
        if (this._initChartsTimeout) clearTimeout(this._initChartsTimeout);
        
        this._initChartsTimeout = setTimeout(() => {
            try {
                if (typeof Chart === 'undefined') { 
                    console.warn('Chart.js não carregado'); 
                    return; 
                }
                
                this.destroyCharts();
                
                const budgets = this.dateFilterActive ? this.filteredBudgets : this.budgets;
                const isMobile = window.innerWidth < 640;
                const statusCtx = statusCanvas.getContext('2d');
                
                const statusCounts = {
                    'Em Processo': budgets.filter(b => b.status === 'em_processo').length,
                    'Aprovado': budgets.filter(b => b.status === 'aprovado').length,
                    'Não Aprovado': budgets.filter(b => b.status === 'nao_aprovado').length,
                    'Alterado': budgets.filter(b => b.status === 'alterado').length,
                    'Concluído': budgets.filter(b => b.status === 'concluido').length,
                    'Pago': budgets.filter(b => b.status === 'pago').length
                };
                
                this.charts.status = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: { 
                        labels: Object.keys(statusCounts), 
                        datasets: [{ 
                            data: Object.values(statusCounts), 
                            backgroundColor: ['#FFA500', '#218040', '#c91530', '#a84d2f', '#2d8a8a', '#1a6b4d'], 
                            borderWidth: 0, 
                            cutout: isMobile ? '35%' : '30%', 
                            hoverOffset: 10, 
                            spacing: 2 
                        }] 
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: true, 
                        plugins: { 
                            legend: { 
                                position: 'bottom', 
                                labels: { 
                                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#000', 
                                    font: { size: isMobile ? 10 : 11, weight: 'normal' }, 
                                    boxWidth: isMobile ? 8 : 10, 
                                    boxHeight: isMobile ? 8 : 10, 
                                    padding: isMobile ? 6 : 10, 
                                    usePointStyle: true, 
                                    pointStyle: 'circle' 
                                } 
                            }, 
                            tooltip: { 
                                bodyFont: { size: isMobile ? 11 : 12 }, 
                                titleFont: { size: isMobile ? 11 : 12 }, 
                                padding: isMobile ? 6 : 8, 
                                callbacks: { 
                                    label: (context) => { 
                                        const label = context.label || ''; 
                                        const value = context.raw || 0; 
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0); 
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0; 
                                        return `${label}: ${value} (${percentage}%)`; 
                                    } 
                                } 
                            } 
                        }, 
                        layout: { 
                            padding: { 
                                top: isMobile ? 5 : 10, 
                                bottom: isMobile ? 5 : 10, 
                                left: isMobile ? 5 : 10, 
                                right: isMobile ? 5 : 10 
                            } 
                        } 
                    } 
                });
                
                const revenueCtx = revenueCanvas.getContext('2d');
                const last6Months = this.getLast6MonthsRevenue();
                
                this.charts.revenue = new Chart(revenueCtx, { 
                    type: 'line', 
                    data: { 
                        labels: last6Months.labels, 
                        datasets: [{ 
                            label: 'Receita (R$)', 
                            data: last6Months.values, 
                            borderColor: '#2d8a8a', 
                            backgroundColor: 'rgba(45, 138, 138, 0.1)', 
                            tension: 0.4, 
                            fill: true, 
                            pointBackgroundColor: '#2d8a8a', 
                            pointBorderColor: '#fff', 
                            pointBorderWidth: 2, 
                            pointRadius: 4 
                        }] 
                    }, 
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: true, 
                        plugins: { 
                            legend: { display: false }, 
                            tooltip: { 
                                callbacks: { 
                                    label: (context) => 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',') 
                                } 
                            } 
                        }, 
                        scales: { 
                            y: { 
                                beginAtZero: true, 
                                ticks: { 
                                    callback: (value) => 'R$ ' + value.toFixed(2).replace('.', ',') 
                                } 
                            } 
                        } 
                    } 
                });
                
                console.log('✅ Gráficos inicializados com sucesso');
            } catch (error) { 
                console.warn('Erro ao inicializar gráficos:', error); 
            }
        }, 300);
    },
    
    destroyCharts() {
        if (this.charts) {
            if (this.charts.status) { 
                this.charts.status.destroy(); 
                this.charts.status = null; 
            }
            if (this.charts.revenue) { 
                this.charts.revenue.destroy(); 
                this.charts.revenue = null; 
            }
        }
    },
    
    getLast6MonthsRevenue() {
        const labels = [];
        const values = [];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
            labels.push(monthName);
            
            const revenue = this.budgets
                .filter(b => { 
                    const budgetDate = new Date(b.date); 
                    return budgetDate.getMonth() === date.getMonth() && budgetDate.getFullYear() === date.getFullYear(); 
                })
                .reduce((sum, b) => sum + (b.total || 0), 0);
            values.push(revenue);
        }
        
        return { labels, values };
    },
    
    // ============================================
    // PALETA DE CORES
    // ============================================
    
    switchPaletteMode(mode) {
        this.paletteMode = mode;
        const auto = document.getElementById('autoPaletteMode');
        const custom = document.getElementById('customPaletteMode');
        const btnGen = document.getElementById('btn-palette-generator');
        const btnCus = document.getElementById('btn-palette-custom');
        
        if (!auto || !custom || !btnGen || !btnCus) return;
        
        if (mode === 'generator') {
            auto.classList.remove('hidden');
            custom.classList.add('hidden');
            btnGen.className = 'flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg';
            btnCus.className = 'flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5';
            this.generatePaletteModels();
        } else {
            auto.classList.add('hidden');
            custom.classList.remove('hidden');
            btnCus.className = 'flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg';
            btnGen.className = 'flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5';
            this.updateCustomPalette();
        }
    },
    
    generatePaletteModels() {
        const color = document.getElementById('paletteColor')?.value || '#2d8a8a';
        this.currentBudgetPalettes = Utils.colorUtils.generatePaletteModels(color);
        this.updatePaletteDisplay();
    },
    
    updatePaletteDisplay() {
        const modelSelect = document.getElementById('paletteModel');
        if (!modelSelect) return;
        
        const model = modelSelect.value;
        const map = { 
            monochromatic: 'monocromatica', 
            analogous: 'analogica', 
            complementary: 'complementar', 
            triadic: 'triadica', 
            tetradic: 'tetradica' 
        };
        const key = map[model] || model;
        const colors = this.currentBudgetPalettes[key] || [];
        const grid = document.getElementById('generatedPalette');
        
        if (!grid) return;
        
        if (colors.length === 0) { 
            grid.innerHTML = '<p class="text-center text-gray-500 col-span-5">Gere uma paleta primeiro</p>'; 
            return; 
        }
        
        grid.innerHTML = colors.map(color => `
            <div class="aspect-square rounded-lg shadow-md cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300 relative overflow-hidden group" 
                 style="background-color: ${color};" 
                 onclick="navigator.clipboard.writeText('${color}'); Utils.toast.success('Copiado: ${color}')">
                <div class="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm text-white text-xs font-mono py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ${color}
                </div>
            </div>
        `).join('');
    },
    
    randomizeBaseColor() {
        const input = document.getElementById('paletteColor');
        if (!input) return;
        
        const hex = '#' + Array.from({length:3}, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join('');
        
        input.value = hex;
        this.generatePaletteModels();
    },
    
    updateCustomPalette() {
        const grid = document.getElementById('customPalette');
        if (!grid) return;
        
        const colors = [
            { name: document.getElementById('customColor1Name')?.value || 'Primária', color: document.getElementById('customColor1')?.value || '#2d8a8a' },
            { name: document.getElementById('customColor2Name')?.value || 'Secundária', color: document.getElementById('customColor2')?.value || '#FFFFFF' },
            { name: document.getElementById('customColor3Name')?.value || 'Destaque', color: document.getElementById('customColor3')?.value || '#667eea' },
            { name: document.getElementById('customColor4Name')?.value || 'Fundo', color: document.getElementById('customColor4')?.value || '#f8f9fa' }
        ];
        
        grid.innerHTML = colors.map(c => `
            <div class="text-center cursor-pointer group" onclick="navigator.clipboard.writeText('${c.color}'); Utils.toast.success('Copiado: ${c.color}')">
                <div class="w-full h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-1 group-hover:scale-105 transition-transform duration-300" 
                     style="background-color: ${c.color}"></div>
                <div class="text-xs font-semibold">${c.name}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${c.color}</div>
            </div>
        `).join('');
    },
    
    copyPaletteHexCodes() {
        const modelSelect = document.getElementById('paletteModel');
        const model = modelSelect.value;
        const map = { 
            monochromatic: 'monocromatica', 
            analogous: 'analogica', 
            complementary: 'complementar', 
            triadic: 'triadica', 
            tetradic: 'tetradica' 
        };
        const key = map[model] || model;
        const colors = this.currentBudgetPalettes[key] || [];
        const hexCodes = colors.join('\n');
        
        navigator.clipboard.writeText(hexCodes).then(() => { 
            Utils.toast.success('Códigos HEX copiados!'); 
        });
    },
    
    copyCustomPaletteHex() {
        const ids = ['customColor1','customColor2','customColor3','customColor4'];
        const values = ids.map(id => { 
            const el = document.getElementById(id); 
            return el ? el.value : ''; 
        }).filter(Boolean);
        const list = values.join('\n');
        
        if (list) { 
            navigator.clipboard.writeText(list).then(() => { 
                Utils.toast.success('Códigos HEX copiados!'); 
            }); 
        }
    },
    
    // ============================================
    // CLIENTES
    // ============================================
    
    showAddClientModal() {
        this.navigate('clients');
        document.getElementById('client-name').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-company').value = '';
        this.editingClientId = null;
        this.openModal('client-modal');
    },
    
    editClient(id) {
        console.log('Editando cliente ID:', id);
        this.navigate('clients');
        
        const client = this.clients.find(c => c.id === id);
        if (!client) { 
            Utils.toast.error('Cliente não encontrado'); 
            return; 
        }
        
        document.getElementById('client-name').value = client.name || '';
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('client-company').value = client.company || '';
        this.editingClientId = id;
        this.openModal('client-modal');
    },
    
    saveClient() {
        const name = document.getElementById('client-name')?.value.trim();
        const email = document.getElementById('client-email')?.value.trim();
        const phone = document.getElementById('client-phone')?.value;
        const company = document.getElementById('client-company')?.value;
        
        if (!name || !email) { 
            Utils.toast.error('Preencha nome e e-mail'); 
            return; 
        }
        
        if (!Validators.isValidEmail(email)) {
            Utils.toast.error('E-mail inválido');
            return;
        }
        
        let newClientId = null;
        
        if (this.editingClientId) {
            const clientData = { name, email, phone, company };
            Store.updateClient(this.editingClientId, clientData);
            Utils.toast.success('Cliente atualizado com sucesso!');
            this.editingClientId = null;
        } else {
            const clientData = { name, email, phone, company, id: Date.now() };
            Store.addClient(clientData);
            newClientId = clientData.id;
            Utils.toast.success('Cliente adicionado com sucesso!');
        }
        
        this.closeModal('client-modal');
        this.renderClients();
        
        // ATUALIZAR SELECT DO ORÇAMENTO SE O MODAL ESTIVER ABERTO
        const budgetModal = document.getElementById('budget-modal');
        if (budgetModal && !budgetModal.classList.contains('hidden')) {
            this.updateBudgetClientSelect(newClientId);
        }
    },
    
    removeClient(id) {
        if (confirm('Tem certeza que deseja remover este cliente?')) {
            Store.removeClient(id);
            this.renderClients();
            Utils.toast.success('Cliente removido!');
        }
    },
    
    renderClients() {
        let filtered = this.clients;
        const searchTerm = this.clientSearchFilter?.toLowerCase() || '';
        
        if (searchTerm) { 
            filtered = filtered.filter(c => 
                c.name?.toLowerCase().includes(searchTerm) || 
                c.email?.toLowerCase().includes(searchTerm)
            ); 
        }
        
        const list = document.getElementById('clients-list');
        const emptyState = document.getElementById('clients-empty-state');
        
        if (!list) return;
        
        if (filtered.length === 0) {
            list.innerHTML = '';
            if (emptyState) emptyState?.classList.remove('hidden');
        } else {
            if (emptyState) emptyState?.classList.add('hidden');
            list.innerHTML = filtered.map(client => `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <i class="fa-solid fa-user text-primary"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold">${Utils.escapeHtml(client.name || 'Sem nome')}</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${Utils.escapeHtml(client.email || 'Sem email')}</p>
                            </div>
                        </div>
                        <div class="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                            ${client.phone ? `<span><i class="fa-solid fa-phone mr-1"></i>${Utils.escapeHtml(client.phone)}</span>` : ''}
                            ${client.company ? `<span><i class="fa-solid fa-building mr-1"></i>${Utils.escapeHtml(client.company)}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="app.editClient(${client.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm">
                            <i class="fa-solid fa-pen mr-1"></i> Editar
                        </button>
                        <button onclick="app.removeClient(${client.id})" class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm">
                            <i class="fa-solid fa-trash mr-1"></i> Excluir
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        this.updateClientsCount();
    },
    
    filterClients() {
        this.clientSearchFilter = document.getElementById('client-search')?.value || '';
        this.renderClients();
    },
    
    updateClientsCount() {
        const count = this.clients.length;
        const countSpan = document.getElementById('clients-count');
        const resultsSpan = document.getElementById('clients-results-count');
        
        if (countSpan) countSpan.textContent = count;
        
        if (resultsSpan) { 
            const searchTerm = this.clientSearchFilter?.toLowerCase() || ''; 
            if (searchTerm) { 
                const visibleCount = document.querySelectorAll('#clients-list .bg-white').length; 
                resultsSpan.textContent = visibleCount; 
            } else { 
                resultsSpan.textContent = count; 
            } 
        }
    },
    
    // ============================================
    // SERVIÇOS
    // ============================================
    
    showAddServiceModal(category = '') {
        this.navigate('services');
        
        const idEl = document.getElementById('service-id');
        const categoryEl = document.getElementById('service-category');
        const nameEl = document.getElementById('service-name');
        const priceEl = document.getElementById('service-price');
        const typeEl = document.getElementById('service-type');
        const titleEl = document.getElementById('service-modal-title');
        
        if (idEl) idEl.value = '';
        if (categoryEl) categoryEl.value = category;
        if (nameEl) nameEl.value = '';
        if (priceEl) priceEl.value = '';
        if (typeEl) typeEl.value = 'fixed';
        if (titleEl) titleEl.textContent = 'Adicionar Serviço';
        
        this.openModal('service-modal');
    },
    
    editService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;
        
        this.navigate('services');
        
        const idEl = document.getElementById('service-id');
        const categoryEl = document.getElementById('service-category');
        const nameEl = document.getElementById('service-name');
        const priceEl = document.getElementById('service-price');
        const typeEl = document.getElementById('service-type');
        const titleEl = document.getElementById('service-modal-title');
        
        if (idEl) idEl.value = id;
        if (categoryEl) categoryEl.value = service.category;
        if (nameEl) nameEl.value = service.name;
        if (priceEl) priceEl.value = service.price;
        if (typeEl) typeEl.value = service.type;
        if (titleEl) titleEl.textContent = 'Editar Serviço';
        
        this.openModal('service-modal');
    },
    
    saveService() {
        const id = document.getElementById('service-id')?.value;
        const category = document.getElementById('service-category')?.value.trim();
        const name = document.getElementById('service-name')?.value.trim();
        const price = parseInt(document.getElementById('service-price')?.value) || 0;
        const type = document.getElementById('service-type')?.value;
        
        if (!category || !name) { 
            Utils.toast.error('Preencha categoria e nome'); 
            return; 
        }
        
        if (id) { 
            Store.updateService(parseInt(id), { category, name, price, type }); 
            Utils.toast.success('Serviço atualizado!'); 
        } else { 
            Store.addService({ category, name, price, type }); 
            Utils.toast.success('Serviço adicionado!'); 
        }
        
        this.closeModal('service-modal');
        this.renderServicesList();
    },
    
    removeService(id) {
        if (confirm('Remover este serviço?')) { 
            Store.removeService(id); 
            this.renderServicesList(); 
        }
    },
    
    renderServicesList() {
        console.log('Renderizando serviços...', this.services);
        
        const grouped = {};
        this.services.forEach(s => { 
            if (!grouped[s.category]) grouped[s.category] = []; 
            grouped[s.category].push(s); 
        });
        
        const accordion = document.getElementById('services-accordion');
        if (!accordion) { 
            console.error('Elemento services-accordion não encontrado!'); 
            return; 
        }
        
        if (Object.keys(grouped).length === 0) {
            accordion.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400 animate-fade-in">
                    <i class="fa-solid fa-bullseye text-4xl mb-3 opacity-50"></i>
                    <p>Nenhum serviço cadastrado</p>
                    <button onclick="app.showAddServiceModal()" class="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg">
                        <i class="fa-solid fa-plus mr-2"></i>Adicionar Primeiro Serviço
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        Object.keys(grouped).sort().forEach((category, catIndex) => {
            html += `
                <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden accordion-item animate-fade-in" style="animation-delay: ${catIndex * 0.1}s">
                    <div class="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer" 
                         onclick="this.closest('.accordion-item').classList.toggle('active')">
                        <span class="font-medium flex items-center gap-2">
                            <i class="fa-regular fa-folder-open text-primary"></i>
                            ${category} 
                            <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">${grouped[category].length}</span>
                        </span>
                        <i class="fa-solid fa-chevron-down transform transition-transform duration-300 accordion-chevron"></i>
                    </div>
                    <div class="hidden p-4 space-y-2 bg-white dark:bg-gray-900 accordion-content">
                        ${grouped[category].map((s, index) => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200" 
                                 style="animation-delay: ${index * 0.05}s">
                                <div>
                                    <div class="font-medium">${s.name}</div>
                                    <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <span>R$ ${s.price.toLocaleString('pt-BR')}</span>
                                        <span class="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        <span>${s.type === 'hourly' ? 'por hora' : 'preço fixo'}</span>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="app.editService(${s.id})" class="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-600" title="Editar serviço">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button onclick="app.removeService(${s.id})" class="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-600" title="Excluir serviço">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                        <div class="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <button onclick="app.showAddServiceModal('${category}')" class="text-sm text-primary hover:underline flex items-center gap-1">
                                <i class="fa-solid fa-plus"></i>Adicionar serviço em "${category}"
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        accordion.innerHTML = html;
        console.log('✅ Serviços renderizados com sucesso!');
    },
    
    // ============================================
    // ORÇAMENTOS
    // ============================================
    
    startNewBudget() {
        console.log('Iniciando novo orçamento...');
        this.navigate('budgets');
        this.isEditing = false;
        this.currentBudgetId = null;
        this.currentBudgetServices = [];
        this.paletteMode = 'generator';
        
        const select = document.getElementById('budget-client');
        if (select) { 
            const options = this.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join(''); 
            select.innerHTML = `<option value="">Selecione um cliente</option>${options}`; 
        }
        
        const projectEl = document.getElementById('budget-project-name');
        const notesEl = document.getElementById('budget-notes');
        const statusEl = document.getElementById('budget-status');
        const hourlyEl = document.getElementById('budget-hourly');
        const hoursEl = document.getElementById('budget-hours-worked');
        const deadlineEl = document.getElementById('budget-deadline');
        const termsEl = document.getElementById('budget-payment-terms');
        const validityEl = document.getElementById('budget-validity');
        const saveBtn = document.getElementById('budget-save-btn');
        const paletteColor = document.getElementById('paletteColor');
        const paletteModel = document.getElementById('paletteModel');
        
        if (projectEl) projectEl.value = '';
        if (notesEl) notesEl.value = '';
        if (statusEl) statusEl.value = 'em_processo';
        if (hourlyEl) hourlyEl.value = this.settings.hourlyRate || 150;
        if (hoursEl) hoursEl.value = '0';
        if (deadlineEl) deadlineEl.value = '7';
        if (termsEl) termsEl.value = '';
        if (validityEl) validityEl.value = '30';
        if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Gerar Orçamento';
        if (paletteColor) paletteColor.value = '#2d8a8a';
        if (paletteModel) paletteModel.value = 'monochromatic';
        
        this.setTodayDate();
        this.initializeCategoryFilter();
        this.displayFilteredServices();
        this.updateBudgetTotal();
        this.switchPaletteMode('generator');
        
        console.log('Abrindo modal de orçamento...');
        this.openModal('budget-modal');
    },
    
    editBudget(id) {
        this.navigate('budgets');
        
        const budget = this.budgets.find(b => b.id === id);
        if (!budget) return;
        
        this.isEditing = true;
        this.currentBudgetId = id;
        this.currentBudgetServices = budget.services ? budget.services.map(s => ({ ...s })) : [];
        
        const select = document.getElementById('budget-client');
        if (select) { 
            const options = this.clients.map(c => `<option value="${c.id}" ${c.id === budget.clientId ? 'selected' : ''}>${c.name}</option>`).join(''); 
            select.innerHTML = `<option value="">Selecione um cliente</option>${options}`; 
        }
        
        const dateEl = document.getElementById('budget-date');
        const projectEl = document.getElementById('budget-project-name');
        const notesEl = document.getElementById('budget-notes');
        const statusEl = document.getElementById('budget-status');
        const hourlyEl = document.getElementById('budget-hourly');
        const hoursEl = document.getElementById('budget-hours-worked');
        const deadlineEl = document.getElementById('budget-deadline');
        const termsEl = document.getElementById('budget-payment-terms');
        const validityEl = document.getElementById('budget-validity');
        const saveBtn = document.getElementById('budget-save-btn');
        
        if (dateEl) dateEl.value = budget.date;
        if (projectEl) projectEl.value = budget.projectName || '';
        if (notesEl) notesEl.value = budget.notes || '';
        if (statusEl) statusEl.value = budget.status || 'em_processo';
        if (hourlyEl) hourlyEl.value = this.settings.hourlyRate || 150;
        if (hoursEl) hoursEl.value = budget.hoursWorked || 0;
        if (deadlineEl) deadlineEl.value = budget.deadline || 7;
        if (termsEl) termsEl.value = budget.paymentTerms || '';
        if (validityEl) validityEl.value = budget.validity || 30;
        if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Atualizar Orçamento';
        
        this.initializeCategoryFilter();
        this.displayFilteredServices();
        this.updateBudgetTotal();
        this.openModal('budget-modal');
    },
    
    saveBudget() {
        const clientId = document.getElementById('budget-client')?.value;
        if (!clientId) { 
            Utils.toast.error('Selecione um cliente'); 
            return; 
        }
        
        const client = this.clients.find(c => c.id === parseInt(clientId));
        if (!client) { 
            Utils.toast.error('Cliente não encontrado'); 
            return; 
        }
        
        let subtotal = 0;
        this.currentBudgetServices.forEach(s => { 
            const price = s.customPrice !== null ? s.customPrice : s.price; 
            subtotal += price * s.qty; 
        });
        
        const hourly = parseInt(document.getElementById('budget-hourly')?.value) || 0;
        const hoursWorked = parseFloat(document.getElementById('budget-hours-worked')?.value) || 0;
        const hoursCost = hourly * hoursWorked;
        const total = subtotal + hoursCost;
        
        let customPalette = null;
        let generatedPalette = null;
        let paletteModel = null;
        
        if (this.paletteMode === 'custom') {
            customPalette = [
                { name: document.getElementById('customColor1Name')?.value || 'Primária', color: document.getElementById('customColor1')?.value || '#2d8a8a' },
                { name: document.getElementById('customColor2Name')?.value || 'Secundária', color: document.getElementById('customColor2')?.value || '#FFFFFF' },
                { name: document.getElementById('customColor3Name')?.value || 'Destaque', color: document.getElementById('customColor3')?.value || '#667eea' },
                { name: document.getElementById('customColor4Name')?.value || 'Fundo', color: document.getElementById('customColor4')?.value || '#f8f9fa' }
            ];
        } else {
            const modelSelect = document.getElementById('paletteModel');
            const map = { monochromatic: 'monocromatica', analogous: 'analogica', complementary: 'complementar', triadic: 'triadica', tetradic: 'tetradica' };
            paletteModel = modelSelect ? (map[modelSelect.value] || modelSelect.value) : null;
            generatedPalette = paletteModel ? (this.currentBudgetPalettes[paletteModel] || null) : null;
        }
        
        const budgetData = {
            clientId: parseInt(clientId), 
            clientName: client.name, 
            services: this.currentBudgetServices,
            notes: document.getElementById('budget-notes')?.value, 
            status: document.getElementById('budget-status')?.value,
            date: document.getElementById('budget-date')?.value, 
            projectName: document.getElementById('budget-project-name')?.value,
            deadline: parseInt(document.getElementById('budget-deadline')?.value) || 7, 
            paymentTerms: document.getElementById('budget-payment-terms')?.value,
            validity: parseInt(document.getElementById('budget-validity')?.value) || 30, 
            subtotal, 
            hoursWorked, 
            hoursCost, 
            total,
            paletteSource: this.paletteMode, 
            customPalette, 
            generatedPalette, 
            paletteModel
        };
        
        if (this.isEditing && this.currentBudgetId) { 
            Store.updateBudget(this.currentBudgetId, budgetData); 
            Utils.toast.success('Orçamento atualizado!'); 
        } else { 
            Store.addBudget(budgetData); 
            Utils.toast.success('Orçamento criado!'); 
        }
        
        this.closeModal('budget-modal');
        this.updateDashboard();
        this.renderBudgetsList();
    },
    
    deleteBudget(id) {
        if (confirm('Excluir este orçamento?')) { 
            Store.removeBudget(id); 
            this.updateDashboard(); 
            this.renderBudgetsList(); 
        }
    },
    
    filterBudgetsByStatus() { 
        this.renderBudgetsList(); 
    },
    
    renderBudgetsList() {
        const statusFilter = document.getElementById('budget-filter-status')?.value;
        let filtered = this.budgets;
        if (statusFilter) filtered = filtered.filter(b => b.status === statusFilter);
        
        const list = document.getElementById('budgets-list');
        if (!list) return;
        
        if (filtered.length === 0) { 
            list.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i class="fa-solid fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                    <p>Nenhum orçamento encontrado</p>
                </div>
            `; 
            return; 
        }
        
        list.innerHTML = filtered.map(b => {
            const statusClass = { 
                'em_processo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
                'aprovado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
                'nao_aprovado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 
                'alterado': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
                'concluido': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
                'pago': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
            }[b.status] || 'bg-gray-100 text-gray-800';
            
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold">${b.projectName || 'Projeto sem nome'}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">#${b.id?.toString().slice(-4)}</span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            ${b.clientName} • R$ ${b.total.toFixed(2)} • ${b.services?.length || 0} serviços • ${b.date}
                        </p>
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                            ${this.getStatusLabel(b.status)}
                        </span>
                    </div>
                    <div class="flex gap-2 self-end sm:self-auto">
                        <button onclick="app.editBudget(${b.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm transition-all duration-200 transform hover:scale-105">
                            <i class="fa-solid fa-pen mr-1"></i> Editar
                        </button>
                        <button onclick="app.generatePDF(${b.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm transition-all duration-200 transform hover:scale-105">
                            <i class="fa-regular fa-file-pdf mr-1"></i> PDF
                        </button>
                        <button onclick="app.deleteBudget(${b.id})" class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm transition-all duration-200 transform hover:scale-105">
                            <i class="fa-solid fa-trash mr-1"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    getStatusLabel(status) {
        const labels = { 
            em_processo: 'Em Processo', 
            aprovado: 'Aprovado', 
            nao_aprovado: 'Não Aprovado', 
            alterado: 'Alterado', 
            concluido: 'Concluído', 
            pago: 'Pago' 
        };
        return labels[status] || status;
    },
    
    // ============================================
    // SERVIÇOS NO ORÇAMENTO
    // ============================================
    
    initializeCategoryFilter() {
        const categories = [...new Set(this.services.map(s => s.category))].sort();
        const select = document.getElementById('service-category-filter');
        if (!select) return;
        
        select.innerHTML = '<option value="">Todas as categorias</option>';
        categories.forEach(cat => { 
            const option = document.createElement('option'); 
            option.value = cat; 
            option.textContent = cat; 
            select.appendChild(option); 
        });
    },
    
    filterServicesByCategory() { 
        this.currentBudgetFilter.category = document.getElementById('service-category-filter')?.value || ''; 
        this.displayFilteredServices(); 
    },
    
    searchServices() { 
        this.currentBudgetFilter.search = document.getElementById('service-search')?.value.toLowerCase() || ''; 
        this.displayFilteredServices(); 
    },
    
    displayFilteredServices() {
        const filter = this.currentBudgetFilter;
        let filtered = this.services.filter(s => { 
            const categoryMatch = !filter.category || s.category === filter.category; 
            const searchMatch = !filter.search || s.name.toLowerCase().includes(filter.search); 
            return categoryMatch && searchMatch; 
        });
        
        const container = document.getElementById('services-list-container');
        if (!container) return;
        
        if (filtered.length === 0) { 
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fa-solid fa-search text-3xl mb-2 opacity-50"></i>
                    <p class="text-sm">Nenhum serviço encontrado</p>
                </div>
            `; 
            return; 
        }
        
        container.innerHTML = filtered.map(service => {
            const current = this.currentBudgetServices.find(s => s.id === service.id);
            const qty = current ? current.qty : 0;
            
            return `
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">${service.name}</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400">R$ ${service.price}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="app.updateServiceQty(${service.id}, ${qty - 1})" class="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors">
                            <i class="fa-solid fa-minus text-xs"></i>
                        </button>
                        <input type="number" value="${qty}" onchange="app.updateServiceQty(${service.id}, this.value)" 
                               class="w-16 text-center px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <button onclick="app.updateServiceQty(${service.id}, ${qty + 1})" class="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors">
                            <i class="fa-solid fa-plus text-xs"></i>
                        </button>
                        ${qty > 0 ? `<span class="ml-auto text-sm font-semibold">Total: R$ ${((current?.customPrice || service.price) * qty).toFixed(2)}</span>` : ''}
                    </div>
                    ${qty > 0 ? `
                        <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <label class="text-xs text-gray-600 dark:text-gray-400">Preço:</label>
                            <input type="number" value="${current?.customPrice || service.price}" 
                                   onchange="app.updateServicePrice(${service.id}, this.value)" 
                                   class="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <button onclick="app.resetServicePrice(${service.id})" class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors">Reset</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        this.updateSelectedServicesSummary();
        this.updateBudgetTotal();
    },
    
    updateServiceQty(serviceId, qty) {
        qty = Math.max(0, parseInt(qty) || 0);
        const index = this.currentBudgetServices.findIndex(s => s.id === serviceId);
        const service = this.services.find(s => s.id === serviceId);
        
        if (!service) return;
        
        if (qty === 0) { 
            if (index !== -1) this.currentBudgetServices.splice(index, 1); 
        } else { 
            if (index !== -1) { 
                this.currentBudgetServices[index].qty = qty; 
            } else { 
                this.currentBudgetServices.push({ ...service, qty, customPrice: null }); 
            } 
        }
        
        this.displayFilteredServices();
    },
    
    updateServicePrice(serviceId, price) {
        const service = this.currentBudgetServices.find(s => s.id === serviceId);
        if (service) { 
            service.customPrice = parseFloat(price) || null; 
        }
        
        this.updateSelectedServicesSummary();
        this.updateBudgetTotal();
    },
    
    resetServicePrice(serviceId) {
        const service = this.currentBudgetServices.find(s => s.id === serviceId);
        if (service) { 
            service.customPrice = null; 
        }
        
        this.updateSelectedServicesSummary();
        this.updateBudgetTotal();
        this.displayFilteredServices();
    },
    
    updateSelectedServicesSummary() {
        const summary = document.getElementById('selected-services-summary');
        if (!summary) return;
        
        if (this.currentBudgetServices.length === 0) { 
            summary.innerHTML = '<span class="text-sm text-gray-500 dark:text-gray-400">Nenhum serviço selecionado</span>'; 
            return; 
        }
        
        summary.innerHTML = this.currentBudgetServices.map(s => { 
            const price = s.customPrice !== null ? s.customPrice : s.price; 
            const total = (price * s.qty).toFixed(2); 
            return `<div class="flex justify-between text-sm"><span>${s.name} x${s.qty}</span><span class="font-medium">R$ ${total}</span></div>`; 
        }).join('');
    },
    
    updateBudgetTotal() {
        let subtotal = 0;
        this.currentBudgetServices.forEach(s => { 
            const price = s.customPrice !== null ? s.customPrice : s.price; 
            subtotal += price * s.qty; 
        });
        
        const hourly = parseInt(document.getElementById('budget-hourly')?.value) || 0;
        const hoursWorked = parseFloat(document.getElementById('budget-hours-worked')?.value) || 0;
        const hoursCost = hourly * hoursWorked;
        const total = subtotal + hoursCost;
        
        const subtotalEl = document.getElementById('budget-subtotal');
        const hoursDisplayEl = document.getElementById('budget-hours-display');
        const hoursCostEl = document.getElementById('budget-hours-cost');
        const totalEl = document.getElementById('budget-total');
        
        if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        if (hoursDisplayEl) hoursDisplayEl.textContent = `${hoursWorked}h`;
        if (hoursCostEl) hoursCostEl.textContent = `R$ ${hoursCost.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;
    },
    
    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    
    loadSettingsToForm() {
        const nameEl = document.getElementById('settingName');
        const emailEl = document.getElementById('settingEmail');
        const hourlyEl = document.getElementById('settingHourlyRate');
        const darkModeEl = document.getElementById('settingDarkMode');
        const baseEl = document.getElementById('settings-theme-base');
        
        if (nameEl) nameEl.value = this.settings.name || '';
        if (emailEl) emailEl.value = this.settings.email || '';
        if (hourlyEl) hourlyEl.value = this.settings.hourlyRate || 150;
        if (darkModeEl) darkModeEl.checked = this.settings.theme === 'dark';
        if (this.settings.themePreset && baseEl) baseEl.value = this.settings.themePreset.base || '#2d8a8a';
    },
    
    saveSettings() {
        const nameEl = document.getElementById('settingName');
        const emailEl = document.getElementById('settingEmail');
        const hourlyEl = document.getElementById('settingHourlyRate');
        const darkModeEl = document.getElementById('settingDarkMode');
        
        const updates = { 
            name: nameEl ? nameEl.value : '', 
            email: emailEl ? emailEl.value : '', 
            hourlyRate: parseInt(hourlyEl?.value) || 150, 
            theme: darkModeEl?.checked ? 'dark' : 'light' 
        };
        
        Store.state.settings = { ...Store.state.settings, ...updates };
        Store.save();
        
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) userNameEl.textContent = updates.name;
        if (userAvatarEl) userAvatarEl.textContent = (updates.name || '').charAt(0).toUpperCase();
        
        Utils.toast.success('Configurações salvas!');
    },
    
    // ============================================
    // PDF
    // ============================================
    
    async generatePDF(budgetId) {
        const budget = this.budgets.find(b => b.id === budgetId);
        if (!budget) { 
            Utils.toast.error('Orçamento não encontrado'); 
            return; 
        }
        
        try {
            this.showLoading('Gerando PDF...');
            await PDFGenerators.generateBudgetPDF(budget, this.settings, {
                onSuccess: () => Utils.toast.success('PDF gerado com sucesso!'),
                onError: (error) => Utils.toast.error('Erro: ' + error.message)
            });
        } finally {
            this.hideLoading();
        }
    },
    
    // ============================================
    // UTILITÁRIOS DE MODAL
    // ============================================
    
    openNewClientFromBudget() {
        const nameEl = document.getElementById('client-name');
        const emailEl = document.getElementById('client-email');
        const phoneEl = document.getElementById('client-phone');
        const companyEl = document.getElementById('client-company');
        
        if (nameEl) nameEl.value = '';
        if (emailEl) emailEl.value = '';
        if (phoneEl) phoneEl.value = '';
        if (companyEl) companyEl.value = '';
        
        window.creatingClientFromBudget = true;
        this.openModal('client-modal');
    },
    
    updateBudgetClientSelect(selectedClientId = null) {
        const select = document.getElementById('budget-client');
        if (!select) return;
        
        const options = this.clients.map(c => `<option value="${c.id}" ${c.id === selectedClientId ? 'selected' : ''}>${c.name}</option>`).join('');
        select.innerHTML = `<option value="">Selecione um cliente</option>${options}`;
        
        if (selectedClientId) {
            select.value = selectedClientId;
            const client = this.clients.find(c => c.id === selectedClientId);
            if (client && this.currentBudgetId) {
                this.currentBudgetClientName = client.name;
            }
        }
    },
    
    openModal(id) {
        console.log('Abrindo modal:', id);
        const modal = document.getElementById(id);
        if (modal) { 
            modal.classList.remove('hidden'); 
            modal.classList.add('flex'); 
            modal.style.zIndex = '10000'; 
            console.log('✅ Modal aberto com sucesso'); 
        } else { 
            console.error('❌ Erro: Modal não encontrado com o ID:', id); 
        }
    },
    
    closeModal(id) {
        console.log('Fechando modal:', id);
        const modal = document.getElementById(id);
        if (modal) { 
            modal.classList.add('hidden'); 
            modal.classList.remove('flex'); 
            console.log('✅ Modal fechado'); 
        }
    },
    
    // ============================================
    // SOBRE E ESTATÍSTICAS
    // ============================================
    
    updateAboutStats() {
        const totalServices = document.getElementById('about-total-services');
        const totalClients = document.getElementById('about-total-clients');
        const totalBudgets = document.getElementById('about-total-budgets');
        
        if (totalServices) totalServices.textContent = this.services?.length || 51;
        if (totalClients) totalClients.textContent = this.clients?.length || 0;
        if (totalBudgets) totalBudgets.textContent = this.budgets?.length || 0;
    },

    // ============================================
    // DOCUMENTOS
    // ============================================

    renderDocuments() {
        console.log('Renderizando documentos...');
        // A lógica de documentos está no módulo documents.js
        // que é carregado separadamente e se auto-inicializa
    },

    // ============================================
    // PERFIL
    // ============================================

    renderProfile() {
        console.log('Renderizando perfil...');
        // A lógica de perfil está no módulo profile.js
        // que é carregado separadamente e se auto-inicializa
    },

    // ============================================
    // REGISTRO DE USUÁRIO
    // ============================================

    register() {
        const name = document.getElementById('loginName')?.value.trim();
        const email = document.getElementById('registerEmail')?.value.trim();
        const password = document.getElementById('registerPassword')?.value;
        
        if (!name || !email || !password) {
            Utils.toast.error('Preencha todos os campos');
            return;
        }
        
        if (!Validators.isValidEmail(email)) {
            Utils.toast.error('E-mail inválido');
            return;
        }
        
        if (password.length < 6) {
            Utils.toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }
        
        Auth.register(email, password, name)
            .then(user => {
                Store.load(user.userId);
                Store.state.settings.name = user.name;
                Store.state.settings.email = user.email;
                Store.save();
                
                localStorage.setItem('dbp_last_user', user.userId);
                this.isLoggedIn = true;
                this.updateUIFromStore();
                
                Utils.toast.success(`Bem-vindo, ${user.name}! Conta criada com sucesso.`);
                
                const nav = document.querySelector('nav');
                if (nav) nav.classList.remove('hidden');
                
                const userInfo = document.querySelector('.user-info');
                if (userInfo) userInfo.classList.remove('hidden');
                
                const focusBtn = document.querySelector('.focus-mode-btn');
                if (focusBtn) focusBtn.classList.remove('hidden');
                
                this.navigate('dashboard');
                
                setTimeout(() => {
                    this.updateDashboard();
                    this.renderGoals();
                    this.renderBackupSection();
                    this.updateAboutStats();
                    this.syncCalculatorWithSettings();
                }, 100);
            })
            .catch(error => {
                Utils.toast.error(error.message);
            });
    }
};

// ============================================
// FUNÇÕES GLOBAIS (FORA DO OBJETO app)
// ============================================

// Adicionar função global para toggle de tabs
window.toggleLoginTab = function(tab) {
    const loginForm = document.getElementById('login-form-login');
    const registerForm = document.getElementById('login-form-register');
    const loginTab = document.getElementById('login-tab-login');
    const registerTab = document.getElementById('login-tab-register');
    const registerCheckbox = document.getElementById('loginRegister');
    
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('border-primary', 'text-primary');
        loginTab.classList.remove('border-transparent', 'text-gray-500');
        registerTab.classList.remove('border-primary', 'text-primary');
        registerTab.classList.add('border-transparent', 'text-gray-500');
        if (registerCheckbox) registerCheckbox.value = 'false';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerTab.classList.add('border-primary', 'text-primary');
        registerTab.classList.remove('border-transparent', 'text-gray-500');
        loginTab.classList.remove('border-primary', 'text-primary');
        loginTab.classList.add('border-transparent', 'text-gray-500');
        if (registerCheckbox) registerCheckbox.value = 'true';
    }
};

// ============================================
// EXPOSIÇÃO GLOBAL
// ============================================
window.app = app;
window.colorUtils = Utils.colorUtils;
window.Toast = Utils.toast;

// ============================================
// INICIALIZAÇÃO
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
