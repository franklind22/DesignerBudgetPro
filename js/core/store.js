/**
 * STORE MODULE
 * Gerencia persistência de dados com isolamento por usuário
 */

const Store = (function() {
    'use strict';
    
    // ============================================
    // CONSTANTES
    // ============================================
    
    const STORAGE_PREFIX = 'dbp_user_';
    const BACKUPS_KEY = 'dbp_backups';
    const NOTIFICATIONS_KEY = 'dbp_notifications';
    const MAX_BACKUPS = 20;
    const BACKUP_INTERVAL = 300000; // 5 minutos
    
    // Serviços iniciais padrão
    const DEFAULT_SERVICES = [
        { id: 1, category: 'Identidade Visual', name: 'Logotipo Simples', price: 900, type: 'fixed' },
        { id: 2, category: 'Identidade Visual', name: 'Redesign de Logo', price: 600, type: 'fixed' },
        { id: 3, category: 'Identidade Visual', name: 'Identidade Visual Básica', price: 2500, type: 'fixed' },
        { id: 4, category: 'Identidade Visual', name: 'Identidade Visual Completa', price: 8000, type: 'fixed' },
        { id: 5, category: 'Identidade Visual', name: 'Manual de Marca Básico', price: 3000, type: 'fixed' },
        { id: 6, category: 'Identidade Visual', name: 'Vetorização de Logo', price: 380, type: 'fixed' },
        { id: 7, category: 'Redes Sociais', name: 'Post Instagram (unidade)', price: 60, type: 'fixed' },
        { id: 8, category: 'Redes Sociais', name: 'Carrossel Instagram', price: 150, type: 'fixed' },
        { id: 9, category: 'Redes Sociais', name: 'Stories (unidade)', price: 50, type: 'fixed' },
        { id: 10, category: 'Redes Sociais', name: 'Reels (unidade)', price: 150, type: 'fixed' },
        { id: 11, category: 'Redes Sociais', name: 'Pacote 8 posts/mês', price: 500, type: 'fixed' },
        { id: 12, category: 'Redes Sociais', name: 'Pacote 15 posts/mês', price: 900, type: 'fixed' },
        { id: 13, category: 'Redes Sociais', name: 'Pacote 30 posts/mês', price: 1800, type: 'fixed' },
        { id: 14, category: 'Redes Sociais', name: 'Padronização de Redes', price: 600, type: 'fixed' },
        { id: 15, category: 'Redes Sociais', name: 'Gestão Redes (mensal)', price: 1500, type: 'fixed' },
        { id: 16, category: 'Materiais Impressos', name: 'Cartão de Visita', price: 200, type: 'fixed' },
        { id: 17, category: 'Materiais Impressos', name: 'Papel Timbrado', price: 200, type: 'fixed' },
        { id: 18, category: 'Materiais Impressos', name: 'Envelope', price: 200, type: 'fixed' },
        { id: 19, category: 'Materiais Impressos', name: 'Flyer/Panfleto A5', price: 350, type: 'fixed' },
        { id: 20, category: 'Materiais Impressos', name: 'Folder (frente e verso)', price: 500, type: 'fixed' },
        { id: 21, category: 'Materiais Impressos', name: 'Banner/Faixa', price: 450, type: 'fixed' },
        { id: 22, category: 'Materiais Impressos', name: 'Cartaz/Poster', price: 450, type: 'fixed' },
        { id: 23, category: 'Materiais Impressos', name: 'Cardápio/Menu', price: 500, type: 'fixed' },
        { id: 24, category: 'Materiais Impressos', name: 'Convite', price: 350, type: 'fixed' },
        { id: 25, category: 'Materiais Impressos', name: 'Certificado', price: 450, type: 'fixed' },
        { id: 26, category: 'Materiais Impressos', name: 'Crachá', price: 200, type: 'fixed' },
        { id: 27, category: 'Editorial', name: 'Capa de Livro/Revista', price: 500, type: 'fixed' },
        { id: 28, category: 'Editorial', name: 'Diagramação (por página)', price: 25, type: 'fixed' },
        { id: 29, category: 'Editorial', name: 'Catálogo (até 32 páginas)', price: 650, type: 'fixed' },
        { id: 30, category: 'Editorial', name: 'E-book Design', price: 600, type: 'fixed' },
        { id: 31, category: 'Apresentações', name: 'Slide (por unidade)', price: 70, type: 'fixed' },
        { id: 32, category: 'Apresentações', name: 'Apresentação (até 15 slides)', price: 1000, type: 'fixed' },
        { id: 33, category: 'Apresentações', name: 'Apresentação Premium (30 slides)', price: 1500, type: 'fixed' },
        { id: 34, category: 'Apresentações', name: 'Assinatura de E-mail', price: 200, type: 'fixed' },
        { id: 35, category: 'Apresentações', name: 'Template PowerPoint/Canva', price: 600, type: 'fixed' },
        { id: 36, category: 'Vídeo & Motion', name: 'Edição Reels/TikTok (até 1 min)', price: 150, type: 'fixed' },
        { id: 37, category: 'Vídeo & Motion', name: 'Edição Vídeo Simples', price: 250, type: 'fixed' },
        { id: 38, category: 'Vídeo & Motion', name: 'Edição Vídeo YouTube (até 10 min)', price: 400, type: 'fixed' },
        { id: 39, category: 'Vídeo & Motion', name: 'Motion Graphics (30s-1min)', price: 3500, type: 'fixed' },
        { id: 40, category: 'Vídeo & Motion', name: 'Vinheta/Intro Animada', price: 800, type: 'fixed' },
        { id: 41, category: 'Vídeo & Motion', name: 'Thumbnail YouTube', price: 80, type: 'fixed' },
        { id: 42, category: 'Vídeo & Motion', name: 'Pacote 10 Reels/TikTok', price: 1000, type: 'fixed' },
        { id: 43, category: 'Embalagem', name: 'Design de Rótulo', price: 660, type: 'fixed' },
        { id: 44, category: 'Embalagem', name: 'Design Embalagem (com planif.)', price: 1320, type: 'fixed' },
        { id: 45, category: 'Embalagem', name: 'Design Embalagem (sem planif.)', price: 660, type: 'fixed' },
        { id: 46, category: 'Promocional', name: 'Adesivo', price: 350, type: 'fixed' },
        { id: 47, category: 'Promocional', name: 'Camiseta/Uniforme', price: 350, type: 'fixed' },
        { id: 48, category: 'Promocional', name: 'Caneca/Copo', price: 350, type: 'fixed' },
        { id: 49, category: 'Promocional', name: 'Sacola Personalizada', price: 350, type: 'fixed' },
        { id: 50, category: 'Consultoria', name: 'Hora de Consultoria', price: 120, type: 'hourly' },
        { id: 51, category: 'Consultoria', name: 'Hora de Design', price: 100, type: 'hourly' }
    ];
    
    // ============================================
    // ESTADO PRIVADO
    // ============================================
    
    let _currentUserId = null;
    let _state = {
        settings: {
            name: '',
            email: '',
            hourlyRate: 150,
            theme: 'light',
            themePreset: null,
            goals: {
                monthly: 50000,
                yearly: 600000,
                projectsPerMonth: 10
            }
        },
        clients: [],
        services: [...DEFAULT_SERVICES],
        budgets: [],
        currentBudgetPalettes: {}
    };
    
    let _backupInterval = null;
    
    // ============================================
    // PRIVADO
    // ============================================
    
    function _getStorageKey(userId) {
        return `${STORAGE_PREFIX}${userId}`;
    }
    
    function _ensureGoals(data) {
        if (!data.settings.goals) {
            data.settings.goals = {
                monthly: 50000,
                yearly: 600000,
                projectsPerMonth: 10
            };
        }
        return data;
    }
    
    function _dispatchUpdate() {
        document.dispatchEvent(new CustomEvent('storeUpdated', { detail: _state }));
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    return {
        /**
         * Obtém o estado atual
         */
        get state() {
            return _state;
        },
        
        /**
         * Obtém o usuário atual
         */
        get currentUserId() {
            return _currentUserId;
        },
        
        /**
         * Carrega dados de um usuário
         */
        load(userId) {
            if (!userId) return null;
            
            _currentUserId = userId;
            const key = _getStorageKey(userId);
            
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const data = JSON.parse(stored);
                    _state = { ..._state, ...data, currentUserId: userId };
                    _ensureGoals(_state);
                    console.log(`✅ Dados carregados para ${userId}`);
                } else {
                    _state = {
                        ..._state,
                        currentUserId: userId,
                        services: [...DEFAULT_SERVICES]
                    };
                    _ensureGoals(_state);
                    console.log(`📁 Novo usuário criado: ${userId}`);
                }
            } catch (e) {
                console.warn('Erro ao carregar dados:', e);
            }
            
            return _state;
        },
        
        /**
         * Salva o estado atual
         */
        save() {
            if (!_currentUserId) return;
            
            const key = _getStorageKey(_currentUserId);
            try {
                localStorage.setItem(key, JSON.stringify(_state));
                _dispatchUpdate();
            } catch (e) {
                console.warn('Erro ao salvar dados:', e);
                if (window.Utils?.toast) {
                    Utils.toast.error('Erro ao salvar dados. Armazenamento cheio?');
                }
            }
        },
        
        /**
         * Inicia backup automático
         */
        startAutoBackup() {
            if (_backupInterval) clearInterval(_backupInterval);
            
            _backupInterval = setInterval(() => {
                try {
                    const backup = {
                        timestamp: new Date().toISOString(),
                        data: JSON.parse(JSON.stringify(_state))
                    };
                    
                    let backups = JSON.parse(localStorage.getItem(BACKUPS_KEY) || '[]');
                    backups.push(backup);
                    
                    while (backups.length > MAX_BACKUPS) backups.shift();
                    
                    localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
                    console.log(`✅ Backup automático realizado (${backups.length}/${MAX_BACKUPS})`);
                } catch (error) {
                    console.warn('❌ Erro no backup automático:', error);
                }
            }, BACKUP_INTERVAL);
        },
        
        /**
         * Para backup automático
         */
        stopAutoBackup() {
            if (_backupInterval) {
                clearInterval(_backupInterval);
                _backupInterval = null;
            }
        },
        
        /**
         * Obtém lista de backups
         */
        getBackups() {
            return JSON.parse(localStorage.getItem(BACKUPS_KEY) || '[]');
        },
        
        /**
         * Restaura um backup específico
         */
        restoreBackup(timestamp) {
            const backups = this.getBackups();
            const backup = backups.find(b => b.timestamp === timestamp);
            
            if (backup) {
                _state = backup.data;
                _state.currentUserId = _currentUserId;
                this.save();
                _dispatchUpdate();
                return true;
            }
            return false;
        },
        
        /**
         * Adiciona cliente
         */
        addClient(client) {
            const newClient = { ...client, id: client.id || Date.now() };
            _state.clients.push(newClient);
            this.save();
            return newClient;
        },
        
        /**
         * Atualiza cliente
         */
        updateClient(id, updates) {
            const index = _state.clients.findIndex(c => c.id === id);
            if (index !== -1) {
                _state.clients[index] = { ..._state.clients[index], ...updates, id: id };
                this.save();
                return true;
            }
            return false;
        },
        
        /**
         * Remove cliente
         */
        removeClient(id) {
            _state.clients = _state.clients.filter(c => c.id !== id);
            this.save();
        },
        
        /**
         * Adiciona serviço
         */
        addService(service) {
            const newService = { ...service, id: Date.now() };
            _state.services.push(newService);
            this.save();
            return newService;
        },
        
        /**
         * Atualiza serviço
         */
        updateService(id, updates) {
            const index = _state.services.findIndex(s => s.id === id);
            if (index !== -1) {
                _state.services[index] = { ..._state.services[index], ...updates };
                this.save();
                return true;
            }
            return false;
        },
        
        /**
         * Remove serviço
         */
        removeService(id) {
            _state.services = _state.services.filter(s => s.id !== id);
            this.save();
        },
        
        /**
         * Adiciona orçamento
         */
        addBudget(budget) {
            const docNumber = this.generateBudgetId();
            const newBudget = { ...budget, id: Date.now(), docNumber };
            _state.budgets.push(newBudget);
            this.save();
            this.checkExpiringBudgets();
            return newBudget;
        },
        
        /**
         * Atualiza orçamento
         */
        updateBudget(id, updates) {
            const index = _state.budgets.findIndex(b => b.id === id);
            if (index !== -1) {
                _state.budgets[index] = { ..._state.budgets[index], ...updates };
                this.save();
                return true;
            }
            return false;
        },
        
        /**
         * Remove orçamento
         */
        removeBudget(id) {
            _state.budgets = _state.budgets.filter(b => b.id !== id);
            this.save();
        },
        
        /**
         * Gera ID único para orçamento
         */
        generateBudgetId() {
            const year = new Date().getFullYear();
            const currentYearBudgets = _state.budgets.filter(b => b.docNumber?.startsWith(`ORC-${year}-`));
            let nextNumber = 1;
            
            if (currentYearBudgets.length > 0) {
                const numbers = currentYearBudgets.map(b => {
                    const match = b.docNumber.match(/ORC-\d{4}-(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                });
                nextNumber = Math.max(...numbers) + 1;
            }
            
            return `ORC-${year}-${String(nextNumber).padStart(4, '0')}`;
        },
        
        /**
         * Verifica orçamentos próximos do vencimento
         */
        checkExpiringBudgets() {
            const today = new Date();
            const notifications = [];
            
            _state.budgets.forEach(b => {
                const validityDate = new Date(b.date);
                validityDate.setDate(validityDate.getDate() + (b.validity || 30));
                const daysLeft = Math.ceil((validityDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysLeft > 0 && daysLeft <= 7) {
                    notifications.push({
                        type: 'warning',
                        title: 'Orçamento próximo do vencimento',
                        message: `Orçamento ${b.docNumber} para ${b.clientName} vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
                    });
                }
            });
            
            return notifications;
        },
        
        /**
         * Reseta dados (para logout)
         */
        reset() {
            _currentUserId = null;
            _state = {
                settings: {
                    name: '',
                    email: '',
                    hourlyRate: 150,
                    theme: 'light',
                    themePreset: null,
                    goals: {
                        monthly: 50000,
                        yearly: 600000,
                        projectsPerMonth: 10
                    }
                },
                clients: [],
                services: [...DEFAULT_SERVICES],
                budgets: [],
                currentBudgetPalettes: {}
            };
        }
    };
    
})();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.Store = Store;
}