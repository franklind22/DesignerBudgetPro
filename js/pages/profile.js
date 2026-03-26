/**
 * PROFILE PAGE MODULE
 * Gerencia perfil do usuário, avatar e preferências
 */

(function() {
    'use strict';
    
    // ============================================
    // ESTADO
    // ============================================
    let state = null;
    
    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================
    
    function getStorageKey(userId) {
        return `dbp_user_${userId}`;
    }
    
    function getCurrentUserId() {
        return localStorage.getItem('dbp_last_user');
    }
    
    function loadState() {
        const userId = getCurrentUserId();
        if (!userId) return null;
        try {
            const stored = localStorage.getItem(getStorageKey(userId));
            return stored ? JSON.parse(stored) : null;
        } catch(e) { 
            return null; 
        }
    }
    
    function saveState(data) {
        const userId = getCurrentUserId();
        if (!userId) return;
        try {
            localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
        } catch(e) {
            Utils.toast.error('Erro ao salvar: armazenamento cheio!');
        }
    }
    
    function loadStats() {
        const statClients = document.getElementById('stat-clients');
        const statBudgets = document.getElementById('stat-budgets');
        const statServices = document.getElementById('stat-services');
        
        if (statClients) statClients.textContent = (state.clients || []).length;
        if (statBudgets) statBudgets.textContent = (state.budgets || []).length;
        if (statServices) statServices.textContent = (state.services || []).length;
    }
    
    function loadStorageInfo() {
        const userId = getCurrentUserId();
        try {
            const data = localStorage.getItem(getStorageKey(userId)) || '';
            const bytes = new Blob([data]).size;
            const kb = (bytes / 1024).toFixed(1);
            const storageSize = document.getElementById('storage-size');
            if (storageSize) storageSize.textContent = `${kb} KB`;
        } catch(e) {
            const storageSize = document.getElementById('storage-size');
            if (storageSize) storageSize.textContent = 'N/A';
        }
        
        const backups = JSON.parse(localStorage.getItem('dbp_backups') || '[]');
        if (backups.length) {
            const last = new Date(backups[backups.length-1].timestamp);
            const lastBackup = document.getElementById('last-backup');
            if (lastBackup) lastBackup.textContent = last.toLocaleString('pt-BR');
        }
    }
    
    // ============================================
    // PROFILE FUNCTIONS
    // ============================================
    
    window.loadProfileData = function() {
        const s = state.settings || {};
        const p = s.profile || {};
        
        const displayName = document.getElementById('profile-display-name');
        const displayEmail = document.getElementById('profile-display-email');
        const displaySpecialty = document.getElementById('profile-display-specialty');
        
        if (displayName) displayName.textContent = s.name || '—';
        if (displayEmail) displayEmail.textContent = s.email || '—';
        if (displaySpecialty) displaySpecialty.textContent = p.specialty || 'Designer';
        
        if (p.avatarUrl) {
            window.renderAvatar(p.avatarUrl);
            const removeBtn = document.getElementById('remove-avatar-btn');
            if (removeBtn) removeBtn.classList.remove('hidden');
        } else {
            const initial = (s.name || 'U').charAt(0).toUpperCase();
            const avatarDisplay = document.getElementById('avatar-display');
            if (avatarDisplay) {
                avatarDisplay.textContent = initial;
                avatarDisplay.style.backgroundImage = '';
            }
        }
        
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        const profileCity = document.getElementById('profile-city');
        const profileSpecialty = document.getElementById('profile-specialty');
        const profileBio = document.getElementById('profile-bio');
        const profileWebsite = document.getElementById('profile-website');
        const profileInstagram = document.getElementById('profile-instagram');
        const profileDocument = document.getElementById('profile-document');
        const profilePix = document.getElementById('profile-pix');
        
        if (profileName) profileName.value = s.name || '';
        if (profileEmail) profileEmail.value = s.email || '';
        if (profilePhone) profilePhone.value = p.phone || '';
        if (profileCity) profileCity.value = p.city || '';
        if (profileSpecialty) profileSpecialty.value = p.specialty || '';
        if (profileBio) profileBio.value = p.bio || '';
        if (profileWebsite) profileWebsite.value = p.website || '';
        if (profileInstagram) profileInstagram.value = p.instagram || '';
        if (profileDocument) profileDocument.value = p.document || '';
        if (profilePix) profilePix.value = p.pix || '';
        
        const hourlyRate = document.getElementById('profile-hourly-rate');
        const monthlyGoal = document.getElementById('profile-monthly-goal');
        const yearlyGoal = document.getElementById('profile-yearly-goal');
        const projectsGoal = document.getElementById('profile-projects-goal');
        const paymentTerms = document.getElementById('profile-payment-terms');
        
        if (hourlyRate) hourlyRate.value = s.hourlyRate || 150;
        if (monthlyGoal) monthlyGoal.value = s.goals?.monthly || 50000;
        if (yearlyGoal) yearlyGoal.value = s.goals?.yearly || 600000;
        if (projectsGoal) projectsGoal.value = s.goals?.projectsPerMonth || 10;
        if (paymentTerms) paymentTerms.value = p.paymentTerms || '';
    };
    
    window.saveProfile = function() {
        const name = document.getElementById('profile-name')?.value.trim();
        const email = document.getElementById('profile-email')?.value.trim();
        
        if (!name || !email) {
            Utils.toast.error('Nome e e-mail são obrigatórios!');
            return;
        }
        
        if (!Validators.isValidEmail(email)) {
            Utils.toast.error('E-mail inválido!');
            return;
        }
        
        const pin = document.getElementById('profile-pin')?.value;
        const pinConfirm = document.getElementById('profile-pin-confirm')?.value;
        
        if (pin && pin !== pinConfirm) {
            Utils.toast.error('Os PINs não coincidem!');
            return;
        }
        
        if (!state.settings) state.settings = {};
        if (!state.settings.profile) state.settings.profile = {};
        if (!state.settings.goals) state.settings.goals = {};
        
        state.settings.name = name;
        state.settings.email = email;
        state.settings.hourlyRate = parseFloat(document.getElementById('profile-hourly-rate')?.value) || 150;
        state.settings.goals.monthly = parseFloat(document.getElementById('profile-monthly-goal')?.value) || 50000;
        state.settings.goals.yearly = parseFloat(document.getElementById('profile-yearly-goal')?.value) || 600000;
        state.settings.goals.projectsPerMonth = parseInt(document.getElementById('profile-projects-goal')?.value) || 10;
        
        state.settings.profile.phone = document.getElementById('profile-phone')?.value.trim();
        state.settings.profile.city = document.getElementById('profile-city')?.value.trim();
        state.settings.profile.specialty = document.getElementById('profile-specialty')?.value.trim();
        state.settings.profile.bio = document.getElementById('profile-bio')?.value.trim();
        state.settings.profile.website = document.getElementById('profile-website')?.value.trim();
        state.settings.profile.instagram = document.getElementById('profile-instagram')?.value.trim();
        state.settings.profile.document = document.getElementById('profile-document')?.value.trim();
        state.settings.profile.pix = document.getElementById('profile-pix')?.value.trim();
        state.settings.profile.paymentTerms = document.getElementById('profile-payment-terms')?.value.trim();
        
        if (pin) {
            state.settings.profile.pin = btoa(pin);
        }
        
        saveState(state);
        
        const displayName = document.getElementById('profile-display-name');
        const displayEmail = document.getElementById('profile-display-email');
        const displaySpecialty = document.getElementById('profile-display-specialty');
        const userNameSpan = document.getElementById('userName');
        const userAvatarSpan = document.getElementById('userAvatar');
        
        if (displayName) displayName.textContent = name;
        if (displayEmail) displayEmail.textContent = email;
        if (displaySpecialty) displaySpecialty.textContent = state.settings.profile.specialty || 'Designer';
        if (userNameSpan) userNameSpan.textContent = name;
        if (userAvatarSpan) userAvatarSpan.textContent = name.charAt(0).toUpperCase();
        
        Utils.toast.success('Perfil salvo com sucesso!');
    };
    
    // ============================================
    // AVATAR FUNCTIONS
    // ============================================
    
    window.handleAvatarUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            Utils.toast.error('Selecione uma imagem válida!');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            Utils.toast.error('Imagem muito grande. Máximo 2MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            window.renderAvatar(url);
            if (!state.settings.profile) state.settings.profile = {};
            state.settings.profile.avatarUrl = url;
            saveState(state);
            const removeBtn = document.getElementById('remove-avatar-btn');
            if (removeBtn) removeBtn.classList.remove('hidden');
            Utils.toast.success('Foto atualizada!');
        };
        reader.readAsDataURL(file);
    };
    
    window.renderAvatar = function(url) {
        const el = document.getElementById('avatar-display');
        if (el) {
            el.innerHTML = '';
            el.style.backgroundImage = `url(${url})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
        }
    };
    
    window.removeAvatar = function() {
        const el = document.getElementById('avatar-display');
        if (el) {
            el.style.backgroundImage = '';
            const initial = (state.settings?.name || 'U').charAt(0).toUpperCase();
            el.textContent = initial;
        }
        
        if (state.settings?.profile) delete state.settings.profile.avatarUrl;
        saveState(state);
        
        const removeBtn = document.getElementById('remove-avatar-btn');
        if (removeBtn) removeBtn.classList.add('hidden');
        Utils.toast.success('Foto removida!');
    };
    
    // ============================================
    // TABS
    // ============================================
    
    window.switchProfileTab = function(name) {
        const tabs = ['info', 'financial', 'security'];
        
        tabs.forEach(t => {
            const content = document.getElementById(`profile-content-${t}`);
            const button = document.getElementById(`profile-tab-${t}`);
            if (content) content.classList.add('hidden');
            if (button) button.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`profile-content-${name}`);
        const activeButton = document.getElementById(`profile-tab-${name}`);
        
        if (activeContent) activeContent.classList.remove('hidden');
        if (activeButton) activeButton.classList.add('active');
    };
    
    // ============================================
    // LOGOUT
    // ============================================
    
    window.confirmLogout = function() {
        const modal = document.getElementById('logout-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };
    
    window.closeLogoutModal = function() {
        const modal = document.getElementById('logout-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };
    
    window.doLogout = function() {
        localStorage.removeItem('dbp_last_user');
        window.location.href = 'index.html';
    };
    
    // ============================================
    // EXPORT DATA
    // ============================================
    
    window.exportProfileData = function() {
        try {
            const data = JSON.stringify(state, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dbp_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Utils.toast.success('Dados exportados com sucesso!');
        } catch(e) {
            Utils.toast.error('Erro ao exportar dados.');
        }
    };
    
    // ============================================
    // INIT
    // ============================================
    
    function init() {
        const userId = getCurrentUserId();
        if (!userId) {
            window.location.href = 'index.html';
            return;
        }
        
        state = loadState();
        if (!state) {
            Utils.toast.error('Nenhum dado encontrado. Faça login primeiro.');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Atualizar nome e avatar no header
        const userName = state.settings?.name || 'Usuário';
        const userNameSpan = document.getElementById('userName');
        const userAvatarSpan = document.getElementById('userAvatar');
        
        if (userNameSpan) userNameSpan.textContent = userName;
        if (userAvatarSpan) userAvatarSpan.textContent = userName.charAt(0).toUpperCase();
        
        window.loadProfileData();
        loadStats();
        loadStorageInfo();
        
        console.log('✅ Profile page initialized');
    }
    
    // Aguardar DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();