// ============================================
// DESIGNER BUDGET PRO - CÓDIGO COMPLETO CORRIGIDO
// ============================================

// Utilitário de Cores
const colorUtils = {
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  },
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => { 
      const hex = x.toString(16); 
      return hex.length === 1 ? '0' + hex : hex; 
    }).join('').toUpperCase();
  },
  
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) { 
      h = s = 0; 
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h, s, l };
  },
  
  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { 
      r = g = b = l; 
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },
  
  generatePaletteModels(baseHex) {
    const rgb = this.hexToRgb(baseHex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      monocromatica: this.generateMonochromatic(hsl),
      analogica: this.generateAnalogous(hsl),
      complementar: this.generateComplementary(hsl),
      triadica: this.generateTriadic(hsl),
      tetradica: this.generateTetradic(hsl)
    };
  },
  
  generateMonochromatic(hsl) {
    const colors = [];
    [0.1, 0.3, 0.5, 0.7, 0.9].forEach(l => {
      const rgb = this.hslToRgb(hsl.h, hsl.s, l);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    return colors;
  },
  
  generateAnalogous(hsl) {
    const colors = [];
    [-30, -15, 0, 15, 30].forEach(offset => {
      const newH = ((hsl.h * 360 + offset) % 360) / 360;
      const rgb = this.hslToRgb(newH, hsl.s, hsl.l);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    return colors;
  },
  
  generateComplementary(hsl) {
    const colors = [];
    [0, -0.1, 0.1].forEach(offset => {
      const newH = ((hsl.h + offset) % 1 + 1) % 1;
      const rgb = this.hslToRgb(newH, hsl.s, hsl.l);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    [0, -0.1, 0.1].forEach(offset => {
      const newH = ((hsl.h + 0.5 + offset) % 1 + 1) % 1;
      const rgb = this.hslToRgb(newH, hsl.s, hsl.l);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    return colors;
  },
  
  generateTriadic(hsl) {
    const colors = [];
    [0, 120, 240].forEach(offset => {
      const newH = ((hsl.h * 360 + offset) % 360) / 360;
      const rgb = this.hslToRgb(newH, hsl.s, hsl.l);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    return colors;
  },
  
  generateTetradic(hsl) {
    const colors = [];
    [0, 90, 180, 270].forEach(offset => {
      const newH = ((hsl.h * 360 + offset) % 360) / 360;
      const rgb = this.hslToRgb(newH, hsl.s, hsl.l);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    return colors;
  },
  
  adjustBrightness(hex, percent) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    
    rgb.r = Math.max(0, Math.min(255, rgb.r + percent));
    rgb.g = Math.max(0, Math.min(255, rgb.g + percent));
    rgb.b = Math.max(0, Math.min(255, rgb.b + percent));
    
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }
};

// Sistema de Notificações Toast
const Toast = {
  show(message, type = 'success', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(newContainer);
      container = newContainer;
    }
    
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 animate-slide-in
                      ${type === 'success' ? 'bg-gradient-to-r from-primary to-primary-hover' : 
                        type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                        'bg-gradient-to-r from-blue-500 to-blue-600'}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 
                            type === 'error' ? 'fa-circle-exclamation' : 
                            'fa-circle-info'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-slide-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  info(message) { this.show(message, 'info'); }
};

// Serviços iniciais
const initialServices = [
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

// Store principal com isolamento por usuário
const Store = {
  state: {
    currentUserId: null,
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
    services: initialServices,
    budgets: [],
    currentBudgetPalettes: {}
  },
  
  getStorageKey(userId) {
    return `dbp_user_${userId}`;
  },
  
  load(userId) {
    const key = this.getStorageKey(userId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        // ✅ CORREÇÃO: Garantir que goals existe ao carregar dados
        if (!data.settings.goals) {
          data.settings.goals = {
            monthly: 50000,
            yearly: 600000,
            projectsPerMonth: 10
          };
        }
        this.state = { ...this.state, ...data, currentUserId: userId };
      } else {
        this.state.currentUserId = userId;
        this.state.services = initialServices;
        // ✅ CORREÇÃO: Garantir que goals existe no estado inicial
        if (!this.state.settings.goals) {
          this.state.settings.goals = {
            monthly: 50000,
            yearly: 600000,
            projectsPerMonth: 10
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar:', e);
    }
    return this.state;
  },
  
  save() {
    if (!this.state.currentUserId) return;
    const key = this.getStorageKey(this.state.currentUserId);
    try {
      localStorage.setItem(key, JSON.stringify(this.state));
      document.dispatchEvent(new CustomEvent('storeUpdated', { detail: this.state }));
    } catch (e) {
      console.warn('Erro ao salvar:', e);
    }
  },
  
  autoBackup() {
    const MAX_BACKUPS = 5;
    setInterval(() => {
      try {
        const backup = {
          timestamp: new Date().toISOString(),
          data: JSON.parse(JSON.stringify(this.state))
        };
        const backups = JSON.parse(localStorage.getItem('dbp_backups') || '[]');
        backups.push(backup);
        while (backups.length > MAX_BACKUPS) backups.shift();
        localStorage.setItem('dbp_backups', JSON.stringify(backups));
        console.log(`✅ Backup automático realizado (${backups.length}/${MAX_BACKUPS}):`, new Date().toLocaleString());
      } catch (error) {
        console.warn('❌ Erro no backup automático:', error);
      }
    }, 300000);
  },
  
  getBackups() {
    return JSON.parse(localStorage.getItem('dbp_backups') || '[]');
  },
  
  restoreBackup(timestamp) {
    const backups = this.getBackups();
    const backup = backups.find(b => b.timestamp === timestamp);
    if (backup) {
      this.state = backup.data;
      this.save();
      return true;
    }
    return false;
  },
  
  addClient(client) {
    const newClient = { ...client, id: client.id || Date.now() };
    this.state.clients.push(newClient);
    this.save();
    this.addNotification({
      type: 'success',
      title: 'Cliente adicionado',
      message: `${client.name} foi adicionado com sucesso`
    });
    return newClient;
  },
  
  updateClient(id, updates) {
    const index = this.state.clients.findIndex(c => c.id === id);
    if (index !== -1) {
      this.state.clients[index] = { ...this.state.clients[index], ...updates, id: id };
      this.save();
      this.addNotification({
        type: 'info',
        title: 'Cliente atualizado',
        message: `${updates.name || 'Cliente'} foi atualizado`
      });
      return true;
    }
    return false;
  },
  
  removeClient(id) {
    const client = this.state.clients.find(c => c.id === id);
    this.state.clients = this.state.clients.filter(c => c.id !== id);
    this.save();
    if (client) {
      this.addNotification({
        type: 'warning',
        title: 'Cliente removido',
        message: `${client.name} foi removido`
      });
    }
  },
  
  addService(service) {
    const newService = { ...service, id: Date.now() };
    this.state.services.push(newService);
    this.save();
    this.addNotification({
      type: 'success',
      title: 'Serviço adicionado',
      message: `${service.name} foi adicionado`
    });
    return newService;
  },
  
  updateService(id, updates) {
    const index = this.state.services.findIndex(s => s.id === id);
    if (index !== -1) {
      this.state.services[index] = { ...this.state.services[index], ...updates };
      this.save();
    }
  },
  
  removeService(id) {
    const service = this.state.services.find(s => s.id === id);
    this.state.services = this.state.services.filter(s => s.id !== id);
    this.save();
    if (service) {
      this.addNotification({
        type: 'warning',
        title: 'Serviço removido',
        message: `${service.name} foi removido`
      });
    }
  },
  
  addBudget(budget) {
    const newBudget = { ...budget, id: Date.now(), docNumber: this.generateBudgetId() };
    this.state.budgets.push(newBudget);
    this.save();
    this.checkBudgets();
    this.addNotification({
      type: 'success',
      title: 'Orçamento criado',
      message: `Orçamento ${newBudget.docNumber} para ${budget.clientName} foi criado`
    });
    return newBudget;
  },
  
  updateBudget(id, updates) {
    const index = this.state.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      this.state.budgets[index] = { ...this.state.budgets[index], ...updates };
      this.save();
    }
  },
  
  removeBudget(id) {
    const budget = this.state.budgets.find(b => b.id === id);
    this.state.budgets = this.state.budgets.filter(b => b.id !== id);
    this.save();
    if (budget) {
      this.addNotification({
        type: 'warning',
        title: 'Orçamento removido',
        message: `Orçamento ${budget.docNumber} foi removido`
      });
    }
  },
  
  generateBudgetId() {
    const year = new Date().getFullYear();
    const currentYearBudgets = this.state.budgets.filter(b => b.docNumber?.startsWith(`ORC-${year}-`));
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
  
  notifications: [],
  
  addNotification(notification) {
    const newNotification = { id: Date.now(), read: false, date: new Date().toISOString(), ...notification };
    this.notifications.push(newNotification);
    const notifications = JSON.parse(localStorage.getItem('dbp_notifications') || '[]');
    notifications.push(newNotification);
    if (notifications.length > 50) notifications.shift();
    localStorage.setItem('dbp_notifications', JSON.stringify(notifications));
    document.dispatchEvent(new CustomEvent('notificationAdded', { detail: newNotification }));
  },
  
  getNotifications() {
    return JSON.parse(localStorage.getItem('dbp_notifications') || '[]');
  },
  
  markNotificationAsRead(id) {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('dbp_notifications', JSON.stringify(notifications));
      document.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
  },
  
  markAllNotificationsAsRead() {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    localStorage.setItem('dbp_notifications', JSON.stringify(notifications));
    document.dispatchEvent(new CustomEvent('notificationsUpdated'));
  },
  
  checkBudgets() {
    const today = new Date();
    const expiringBudgets = this.state.budgets.filter(b => {
      const validityDate = new Date(b.date);
      validityDate.setDate(validityDate.getDate() + (b.validity || 30));
      const daysLeft = Math.ceil((validityDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 7;
    });
    expiringBudgets.forEach(b => {
      const validityDate = new Date(b.date);
      validityDate.setDate(validityDate.getDate() + (b.validity || 30));
      const daysLeft = Math.ceil((validityDate - today) / (1000 * 60 * 60 * 24));
      this.addNotification({
        type: 'warning',
        title: 'Orçamento próximo do vencimento',
        message: `Orçamento ${b.docNumber} para ${b.clientName} vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
      });
    });
  }
};

// ============================================
// PDF TEMPLATE — VERSÃO FINAL COM MELHORIAS
// ============================================
const pdfTemplate = {
  _esc(text) {
    if (text === null || text === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  },

  _fmtBRL(value) {
    const n = parseFloat(value) || 0;
    return 'R$ ' + n.toFixed(2).replace('.', ',');
  },

  _extractPalette(budget) {
    if (budget.paletteSource === 'custom' && Array.isArray(budget.customPalette) && budget.customPalette.length) {
      return budget.customPalette;
    }
    if (budget.paletteSource === 'generator' && Array.isArray(budget.generatedPalette) && budget.generatedPalette.length) {
      const result = [];
      for (let i = 0; i < budget.generatedPalette.length; i++) {
        result.push({ name: '', color: budget.generatedPalette[i] });
      }
      return result;
    }
    return [];
  },

  _buildPaletteSection(budget, primaryColor) {
    const colors = this._extractPalette(budget);
    if (!colors.length) return '';

    const sourceLabel = budget.paletteSource === 'custom' ? 'Personalizada' : 'Gerada';
    
    let swatchesHtml = '';
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
      swatchesHtml += `
        <div style="flex: 1; text-align: center; min-width: 55px;">
          <div style="
            height: 45px;
            background-color: ${c.color};
            border-radius: 8px;
            margin-bottom: 5px;
            border: 1px solid #e2e8f0;
          "></div>
          <div style="
            font-size: 8px;
            font-family: monospace;
            font-weight: 500;
            color: #2d3748;
            background: #f5f5f5;
            display: inline-block;
            padding: 2px 5px;
            border-radius: 10px;
          ">${c.color.toUpperCase()}</div>
        </div>
      `;
    }

    return `
      <div style="margin: 16px 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <i class="fa-solid fa-palette" style="color: ${primaryColor}; font-size: 12px;"></i>
          <span style="font-size: 11px; font-weight: 600; color: #1a2a3a;">Paleta de Cores</span>
          <span style="font-size: 8px; color: #494949; background: #f1f5f9; padding: 2px 8px; border-radius: 20px;">${sourceLabel}</span>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-start;">${swatchesHtml}</div>
      </div>
    `;
  },

gerarOrcamentoPDF(budget, settings) {
  console.log('🚀 Iniciando geração do PDF...');
  
  if (!budget) { 
    Toast.error('Orçamento não encontrado'); 
    return; 
  }
  
  try {
    // ========== BUSCAR DADOS DO PERFIL DO USUÁRIO ==========
    // Pegar o estado atual do Store (já carregado)
    const state = Store.state;
    const userProfile = state.settings?.profile || {};
    const userName = state.settings?.name || settings.name || 'Designer Profissional';
    const userEmail = state.settings?.email || settings.email || '';
    const userSpecialty = userProfile.specialty || '';
    const userPhone = userProfile.phone || '';
    const userInstagram = userProfile.instagram || '';
    const userWebsite = userProfile.website || '';
    const userDocument = userProfile.document || '';
    const userPix = userProfile.pix || '';
    
    // Calcular datas
    const issueDate = new Date(budget.date);
    const validityDate = new Date(budget.date);
    validityDate.setDate(validityDate.getDate() + (budget.validity || 30));
    
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = (rootStyles.getPropertyValue('--primary') || '').trim() || '#2d8a8a';
    
    // Agrupar serviços por categoria
    const servicesByCategory = {};
    (budget.services || []).forEach(s => {
      const cat = s.category || 'Serviços';
      if (!servicesByCategory[cat]) servicesByCategory[cat] = [];
      servicesByCategory[cat].push(s);
    });
    
    let servicesHTML = '';
    
    for (const [category, items] of Object.entries(servicesByCategory)) {
      servicesHTML += `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <i class="fa-regular fa-folder-open" style="color: ${primaryColor}; font-size: 10px;"></i>
            <span style="font-size: 11px; font-weight: 600; color: #1e293b;">${this._esc(category)}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #464646;">
                <th style="text-align: left; padding: 5px 4px; font-size: 9px; font-weight: 600; color: #525252;">Serviço</th>
                <th style="text-align: center; padding: 5px 4px; font-size: 9px; font-weight: 600; color: #525252; width: 40px;">Qtd</th>
                <th style="text-align: right; padding: 5px 4px; font-size: 9px; font-weight: 600; color: #525252; width: 80px;">Unitário</th>
                <th style="text-align: right; padding: 5px 4px; font-size: 9px; font-weight: 600; color: #525252; width: 80px;">Total</th>
                </tr>
            </thead>
            <tbody>
      `;
      
      for (const s of items) {
        const price = (s.customPrice !== null && s.customPrice !== undefined) ? s.customPrice : (s.price || 0);
        const total = price * (s.qty || 1);
        servicesHTML += `
          <tr style="border-bottom: 1px solid #464646;">
            <td style="padding: 5px 4px; font-size: 9px; color: #334155;">${this._esc(s.name)}</td>
            <td style="text-align: center; padding: 5px 4px; font-size: 9px; color: #334155;">${this._esc(s.qty || 1)}</td>
            <td style="text-align: right; padding: 5px 4px; font-size: 9px; color: #334155;">${this._fmtBRL(price)}</td>
            <td style="text-align: right; padding: 5px 4px; font-size: 9px; color: #334155;">${this._fmtBRL(total)}</td>
          </tr>
        `;
      }
      
      servicesHTML += `
            </tbody>
          </table>
        </div>
      `;
    }
    
    const paletteHTML = this._buildPaletteSection(budget, primaryColor);
    
    // Montar informações de contato do designer (apenas se preenchidas)
    let contactInfoHTML = '';
    const contactItems = [];
    if (userPhone) contactItems.push(`<i class="fa-solid fa-phone"></i> ${this._esc(userPhone)}`);
    if (userEmail) contactItems.push(`<i class="fa-regular fa-envelope"></i> ${this._esc(userEmail)}`);
    if (userInstagram) contactItems.push(`<i class="fa-brands fa-instagram"></i> @${this._esc(userInstagram)}`);
    if (userWebsite) contactItems.push(`<i class="fa-solid fa-globe"></i> ${this._esc(userWebsite)}`);
    
    if (contactItems.length > 0) {
      contactInfoHTML = `
        <div style="margin-top: 4px; font-size: 7px; color: #525252; display: flex; flex-wrap: wrap; gap: 12px;">
          ${contactItems.map(item => `<span>${item}</span>`).join('')}
        </div>
      `;
    }
    
// Pegar a URL da logo/avatar do perfil
const userAvatarUrl = userProfile.avatarUrl || null;

const logoHTML = `
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 44px; height: 44px; background: ${primaryColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      ${userAvatarUrl ? 
        `<img src="${userAvatarUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : 
        `<i class="fa-solid fa-palette" style="color: white; font-size: 20px;"></i>`
      }
    </div>
    <div>
      <div style="font-size: 14px; font-weight: 700; color: #1a2a3a;">${this._esc(userName)}</div>
      ${userSpecialty ? `<div style="font-size: 9px; color: ${primaryColor}; font-weight: 500;">${this._esc(userSpecialty)}</div>` : ''}
      ${contactInfoHTML}
    </div>
  </div>
`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Orçamento ${budget.docNumber}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.5.0/css/all.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
            margin: 0;
            padding: 28px;
            background: white;
            color: #1e293b;
            font-size: 10px;
            line-height: 1.4;
          }
          .container { max-width: 680px; margin: 0 auto; background: white; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${primaryColor};
            flex-wrap: wrap;
            gap: 12px;
          }
          .title-section {
            text-align: right;
          }
          .title-section h1 {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px 0;
            letter-spacing: -0.3px;
          }
          .title-section p {
            font-size: 10px;
            color: #181818;
            margin: 0;
          }
          .info-grid {
            background: #c5c5c5;
            border-radius: 10px;
            padding: 10px 10px;
            margin-bottom: 15px;
            border-left: 4px solid ${primaryColor};
            border-right: 4px solid ${primaryColor};
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .info-item {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 4px;
          }
          .info-label {
            font-weight: 600;
            color: #181818;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            min-width: 55px;
          }
          .info-value {
            font-weight: 500;
            color: #1e293b;
            font-size: 10px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 700;
            margin: 16px 0 10px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid ${primaryColor};
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .total-box {
            margin-top: 18px;
            text-align: right;
            padding-top: 10px;
            border-top: 1px solid #000000;
          }
          .total-row {
            font-size: 9px;
            margin-bottom: 4px;
            color: #181818;
          }
          .total-grand {
            font-size: 13px;
            font-weight: 700;
            margin-top: 6px;
            color: #000000;
          }
          .payment-box {
            margin: 0 auto 20px auto;
            padding: 6px 20px 14px 20px;
            background: #c5c5c5;
            border-left: 4px solid ${primaryColor};
            border-right: 4px solid ${primaryColor};
            border-radius: 10px;
            font-size: 12px;
            color: #1e293b;
            max-width: 95%;
            line-height: 1.4;
            
          }.notes-box {
            margin: 10px auto;
            padding: 16px 16px;
            background: #c5c5c5;
            border-left: 4px solid ${primaryColor};
            border-right: 4px solid ${primaryColor};
            border-radius: 10px;
            font-size: 12px;
            color: #1e293b;
            text-align: center;
            max-width: 95%;
         }
          .signature-box {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            gap: 24px;
          }
          .signature {
            flex: 1;
            text-align: center;
            border-top: 1px solid #919191;
            padding-top: 8px;
            font-size: 8px;
            color: #181818;
          }
          .footer {
            margin-top: 22px;
            text-align: center;
            font-size: 7px;
            color: #181818;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          table { width: 100%; border-collapse: collapse; }
          i { margin-right: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- CABEÇALHO COM DADOS DO PERFIL -->
          <div class="header">
            ${logoHTML}
            <div class="title-section">
              <h1><i class="fa-regular fa-file-lines"></i> PROPOSTA COMERCIAL</h1>
              <p><i class="fa-regular fa-hashtag"></i> ${this._esc(budget.docNumber || 'ORC-' + String(budget.id || '').slice(-6))}</p>
            </div>
          </div>
          
          <!-- INFORMAÇÕES DO ORÇAMENTO -->
          <div class="info-grid">
            <div class="info-item"><span class="info-label"><i class="fa-regular fa-user"></i> Cliente:</span><span class="info-value">${this._esc(budget.clientName || '—')}</span></div>
            <div class="info-item"><span class="info-label"><i class="fa-regular fa-calendar"></i> Emissão:</span><span class="info-value">${issueDate.toLocaleDateString('pt-BR')}</span></div>
            <div class="info-item"><span class="info-label"><i class="fa-regular fa-hourglass-half"></i> Validade:</span><span class="info-value">${validityDate.toLocaleDateString('pt-BR')}</span></div>
            <div class="info-item">
  <span class="info-label"><i class="fa-regular fa-file-alt"></i> Projeto:</span>
  <span class="info-value">${this._esc(budget.projectName || 'Não especificado')}</span>
</div>
            ${budget.deadline ? `<div class="info-item"><span class="info-label"><i class="fa-regular fa-clock"></i> Prazo:</span><span class="info-value">${budget.deadline} dias</span></div>` : ''}
          </div>
          
          <!-- SERVIÇOS -->
          <div class="section-title"><i class="fa-solid fa-list-ul"></i> SERVIÇOS</div>
          ${servicesHTML || '<p style="color:#525252; font-size:9px;">Nenhum serviço adicionado.</p>'}
          
          <!-- PALETA DE CORES -->
          ${paletteHTML}
          
          <!-- CONDIÇÕES DE PAGAMENTO -->
          ${budget.paymentTerms ? `
          <div class="section-title"><i class="fa-solid fa-credit-card"></i> CONDIÇÕES DE PAGAMENTO</div>
          <div class="payment-box"><i class="fa-solid fa-hand-holding-usd" style="color: ${primaryColor};"></i> ${this._esc(budget.paymentTerms)}</div>
          ` : ''}
          
          <!-- TOTAL -->
          <div class="total-box">
            <div class="total-row"><strong><i class="fa-solid fa-calculator"></i> Subtotal:</strong> ${this._fmtBRL(budget.subtotal || 0)}</div>
            ${budget.hoursWorked > 0 ? `<div class="total-row"><strong><i class="fa-regular fa-clock"></i> Horas (${budget.hoursWorked}h):</strong> ${this._fmtBRL(budget.hoursCost || 0)}</div>` : ''}
            <div class="total-grand"><strong><i class="fa-solid fa-chart-line"></i> TOTAL:</strong> ${this._fmtBRL(budget.total || 0)}</div>
          </div>
          
          <!-- OBSERVAÇÕES -->
          ${budget.notes ? `
          <div class="notes-box"><i class="fa-regular fa-note-sticky"></i><strong>Observações:</strong><br>${this._esc(budget.notes)}</div>
          ` : ''}
          
          <!-- ASSINATURAS -->
  <div class="signature-box">
    <div class="signature">
        <i class="fa-regular fa-pen-to-square"></i> Assinatura do Cliente<br>
        <span style="font-size: 7px;">Data: ___/___/______</span>
    </div>
    <div class="signature">
        <i class="fa-regular fa-pen-to-square"></i> ${this._esc(userName)}<br>
        <span style="font-size: 7px;">Data: ___/___/______</span>
    </div>
</div>
          
          <!-- RODAPÉ -->
          <div class="footer">
            <p><i class="fa-regular fa-clock"></i> Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p><i class="fa-regular fa-calendar-check"></i> Válido até ${validityDate.toLocaleDateString('pt-BR')}</p>
            <p><i class="fa-regular fa-copyright"></i> Designer Budget Pro</p>
          </div>
        </div>
      </body>
      </html>
    `;
      
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '-9999px';
      element.style.width = '680px';
      element.style.backgroundColor = '#ffffff';
      element.style.padding = '15px';
      document.body.appendChild(element);
      
      html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: false
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        
        const pdfWidth = 210;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        const pdf = new jsPDF({
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
          orientation: 'portrait'
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        const safeFileName = `orcamento_${(budget.clientName || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        pdf.save(safeFileName);
        
        document.body.removeChild(element);
        Toast.success('PDF gerado com sucesso!');
        console.log('✅ PDF gerado com sucesso');
      }).catch(err => {
        console.error('❌ Erro html2canvas:', err);
        document.body.removeChild(element);
        Toast.error('Erro ao gerar PDF. Tente novamente.');
      });
      
    } catch (error) {
      console.error('❌ Erro na geração do PDF:', error);
      Toast.error('Erro ao gerar PDF: ' + error.message);
    }
  }
};
// ============================================
// APLICAÇÃO PRINCIPAL - VERSÃO CORRIGIDA
// ============================================

const app = {
  get settings() { return Store.state.settings; },
  get clients() { return Store.state.clients; },
  get services() { return Store.state.services; },
  get budgets() { return Store.state.budgets; },
  
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
  
init() {
    console.log('Inicializando app...');
    const lastUser = localStorage.getItem('dbp_last_user');
    
    // PRIMEIRO: Verificar se há uma view salva no localStorage
    const targetView = localStorage.getItem('dbp_target_view');
    
    if (lastUser) {
        Store.load(lastUser);
        this.isLoggedIn = true;
        this.updateUIFromStore();
        
        // Se tem targetView, navega direto para ela, senão vai para dashboard
        if (targetView && ['dashboard', 'budgets', 'clients', 'services', 'settings'].includes(targetView)) {
            localStorage.removeItem('dbp_target_view');
            this.navigate(targetView);
        } else {
            this.navigate('dashboard');
        }
    } else {
        this.showLogin();
    }
    
    this.setupNavigation();
    this.setTodayDate();
    this.setupThemeToggle();
    this.setupEventListeners();
    this.loadNotifications();
    Store.autoBackup();
    setInterval(() => Store.checkBudgets(), 3600000);
    
    setTimeout(() => {
        this.calcHourlyRate();
        this.calcProjectPrice();
        if (this.isLoggedIn) {
            this.renderGoals();
            this.renderBackupSection();
            this.updateDashboard();
            this.applySavedThemeIfAny();
            this.syncCalculatorWithSettings();
        }
    }, 500);
},

  setupEventListeners() {
    document.addEventListener('storeUpdated', () => { this.updateDashboard(); });
    document.addEventListener('notificationAdded', () => { this.loadNotifications(); });
    document.addEventListener('notificationsUpdated', () => { this.loadNotifications(); });
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
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
          localStorage.theme = 'light';
        } else {
          document.documentElement.classList.add('dark');
          localStorage.theme = 'dark';
        }
      });
    }
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  },
  
  navigate(view) {
    console.log('Navegando para:', view);
    if (!this.isLoggedIn && view !== 'login') { this.showLogin(); return; }
    document.querySelectorAll('main').forEach(m => { m.classList.add('hidden'); m.classList.remove('active'); });
    document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('active', 'bg-primary', 'text-white'); b.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300'); });
    const btn = document.querySelector(`.nav-btn[data-view="${view}"]`);
    if (btn) { btn.classList.add('active', 'bg-primary', 'text-white'); btn.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300'); }
    const targetView = document.getElementById(view + '-view');
    if (targetView) { targetView.classList.remove('hidden'); targetView.classList.add('active'); }
    if (view === 'clients') this.renderClients();
    if (view === 'services') this.renderServicesList();
    if (view === 'budgets') this.renderBudgetsList();
    if (view === 'settings') { this.loadSettingsToForm(); this.renderGoals(); this.renderBackupSection(); this.updateAboutStats(); }
    if (view === 'dashboard') { this.updateDashboard(); setTimeout(() => this.initCharts(), 100); }
  },
  
  showLogin() {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('main').forEach(m => { m.classList.add('hidden'); m.classList.remove('active'); });
    const loginView = document.getElementById('login-view');
    if (loginView) { loginView.classList.remove('hidden'); loginView.classList.add('active'); }
    const nav = document.querySelector('nav');
    if (nav) nav.classList.add('hidden');
    const userInfo = document.querySelector('.user-info');
    if (userInfo) userInfo.classList.add('hidden');
    const focusBtn = document.querySelector('.focus-mode-btn');
    if (focusBtn) focusBtn.classList.add('hidden');
  },
  
  submitLogin() {
    const name = document.getElementById('loginName')?.value.trim();
    const email = document.getElementById('loginEmail')?.value.trim();
    if (!name || !email) { Toast.error('Preencha nome e e-mail'); return; }
    const userId = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    Store.load(userId);
    Store.state.settings.name = name;
    Store.state.settings.email = email;
    Store.save();
    localStorage.setItem('dbp_last_user', userId);
    this.isLoggedIn = true;
    this.updateUIFromStore();
    Toast.success(`Bem-vindo, ${name}!`);
    this.navigate('dashboard');
    const nav = document.querySelector('nav');
    if (nav) nav.classList.remove('hidden');
    const userInfo = document.querySelector('.user-info');
    if (userInfo) userInfo.classList.remove('hidden');
    const focusBtn = document.querySelector('.focus-mode-btn');
    if (focusBtn) focusBtn.classList.remove('hidden');
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
  
  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('flex'); }
  },
  
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
  },
  
  applySavedThemeIfAny() {
    const preset = this.settings.themePreset;
    if (preset && preset.colors) {
      this.applyThemeColors(preset.colors);
      console.log('✅ Tema salvo aplicado:', preset);
    }
  },
  
  applyThemeColors(colors) {
    const root = document.documentElement;
    if (colors.primary) {
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-dark', this.adjustBrightness(colors.primary, -20));
      root.style.setProperty('--primary-light', this.adjustBrightness(colors.primary, 20));
    }
    if (colors.secondary) root.style.setProperty('--secondary', colors.secondary);
    if (colors.bg) root.style.setProperty('--bg', colors.bg);
    this.updateTailwindColors(colors);
  },
  
  updateTailwindColors(colors) {
    document.querySelectorAll('[class*="bg-primary"]').forEach(el => { el.style.transition = 'background-color 0.3s ease'; });
  },
  
  adjustBrightness(hex, percent) {
    if (!hex || !hex.startsWith('#')) return hex;
    try {
      let R = parseInt(hex.substring(1,3), 16);
      let G = parseInt(hex.substring(3,5), 16);
      let B = parseInt(hex.substring(5,7), 16);
      R = Math.max(0, Math.min(255, R + percent));
      G = Math.max(0, Math.min(255, G + percent));
      B = Math.max(0, Math.min(255, B + percent));
      return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
    } catch (e) { console.warn('Erro ao ajustar brilho:', e); return hex; }
  },
  
  applyThemeFromSettings() {
    const baseEl = document.getElementById('settings-theme-base');
    const modelEl = document.getElementById('settings-theme-model');
    if (!baseEl || !modelEl) { Toast.error('Elementos de tema não encontrados'); return; }
    const base = baseEl.value || '#2d8a8a';
    const model = modelEl.value;
    const map = { monochromatic: 'monocromatica', analogous: 'analogica', complementary: 'complementar', triadic: 'triadica', tetradic: 'tetradica' };
    const key = map[model] || 'monocromatica';
    const models = colorUtils.generatePaletteModels(base);
    const palette = models[key] || [];
    const colors = { primary: palette[0] || base, secondary: palette[1] || '#FFFFFF', warning: palette[2] || '#667eea', bg: palette[3] || '#f9faf9' };
    this.applyThemeColors(colors);
    this.settings.themePreset = { base, model: key, colors };
    Store.save();
    Toast.success('Tema aplicado com sucesso!');
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
    if (isDark) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
    this.settings.theme = isDark ? 'dark' : 'light';
    Store.save();
    setTimeout(() => {
      if (this.charts?.status) {
        this.charts.status.options.plugins.legend.labels.color = document.documentElement.classList.contains('dark') ? '#fff' : '#000';
        this.charts.status.update();
      }
    }, 100);
    Toast.success(`Modo ${isDark ? 'escuro' : 'claro'} ativado`);
  },
  
  toggleFocusMode() {
    this.focusMode = !this.focusMode;
    const btn = document.querySelector('.focus-mode-btn i');
    if (this.focusMode) {
      document.body.classList.add('focus-mode');
      if (btn) btn.className = 'fa-regular fa-eye-slash';
      Toast.info('Modo foco ativado');
    } else {
      document.body.classList.remove('focus-mode');
      if (btn) btn.className = 'fa-regular fa-eye';
      Toast.info('Modo foco desativado');
    }
  },
  
  loadNotifications() {
    const notifications = Store.getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (unreadCount > 0) { badge.textContent = unreadCount > 9 ? '9+' : unreadCount; badge.classList.remove('hidden'); }
      else { badge.classList.add('hidden'); }
    }
    this.renderNotifications(notifications);
  },
  
  renderNotifications(notifications) {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    if (notifications.length === 0) {
      list.innerHTML = `<div class="p-4 text-center text-gray-500 dark:text-gray-400"><i class="fa-regular fa-bell-slash text-2xl mb-2"></i><p class="text-sm">Nenhuma notificação</p></div>`;
      return;
    }
    list.innerHTML = notifications.slice(0, 10).map(n => `<div class="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}"><div class="flex items-start gap-3"><i class="fa-solid ${n.type === 'success' ? 'fa-circle-check text-green-500' : n.type === 'warning' ? 'fa-triangle-exclamation text-yellow-500' : 'fa-circle-info text-blue-500'} mt-1"></i><div class="flex-1"><p class="text-sm font-medium">${n.title}</p><p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${n.message}</p><p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${new Date(n.date).toLocaleDateString('pt-BR')} às ${new Date(n.date).toLocaleTimeString('pt-BR')}</p></div>${!n.read ? `<button onclick="Store.markNotificationAsRead(${n.id})" class="text-xs text-primary hover:underline">Marcar como lida</button>` : ''}</div></div>`).join('');
  },
  
  toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
  },
  
  markAllNotificationsAsRead() {
    Store.markAllNotificationsAsRead();
    Toast.success('Todas as notificações marcadas como lidas');
  },
  
  // ✅ CORREÇÃO: renderGoals com validação de segurança
  renderGoals() {
    const container = document.getElementById('goals-container');
    if (!container) return;
    
    // ✅ CORREÇÃO: Garantir que goals existe
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
  
  // ✅ CORREÇÃO: editGoals com validação
  editGoals() {
    // ✅ CORREÇÃO: Garantir que goals existe
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
  
  // ✅ CORREÇÃO: saveGoals com validação
  saveGoals() {
    const monthly = parseInt(document.getElementById('goal-monthly')?.value) || 50000;
    const yearly = parseInt(document.getElementById('goal-yearly')?.value) || 600000;
    const projects = parseInt(document.getElementById('goal-projects')?.value) || 10;
    
    // ✅ CORREÇÃO: Garantir que o objeto goals existe
    if (!this.settings.goals) {
      this.settings.goals = {};
    }
    
    this.settings.goals.monthly = monthly;
    this.settings.goals.yearly = yearly;
    this.settings.goals.projectsPerMonth = projects;
    Store.save();
    
    this.closeModal('goals-modal');
    this.renderGoals();
    Toast.success('Metas atualizadas com sucesso!');
  },
  
  renderBackupSection() {
    const container = document.getElementById('backup-container');
    if (!container) return;
    const backups = Store.getBackups();
    const lastBackup = backups[backups.length - 1];
    const lastBackupInfo = lastBackup ? `<div class="flex items-center gap-2 text-xs text-gray-500"><i class="fa-regular fa-clock"></i><span>Último backup: ${new Date(lastBackup.timestamp).toLocaleDateString('pt-BR')} às ${new Date(lastBackup.timestamp).toLocaleTimeString('pt-BR')}</span></div>` : '';
    container.innerHTML = `<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"><div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"><div class="flex items-center justify-between flex-wrap gap-2"><h3 class="text-lg font-semibold flex items-center gap-2"><i class="fa-solid fa-database text-primary"></i>Backup e Restauração</h3>${lastBackupInfo}</div><p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Proteja seus dados com backup automático</p></div><div class="p-6"><div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between"><div class="flex items-center gap-2"><i class="fa-solid fa-check-circle text-green-500 text-sm"></i><span class="text-xs text-green-700 dark:text-green-400">Backup automático ativo</span></div><div class="flex items-center gap-1 text-xs text-gray-500"><i class="fa-regular fa-clock"></i><span>A cada 5 minutos</span></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"><button onclick="app.exportData()" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"><i class="fa-solid fa-download text-sm"></i><span class="text-sm font-medium">Exportar Dados</span></button><label class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"><i class="fa-solid fa-upload text-sm"></i><span class="text-sm font-medium">Importar Dados</span><input type="file" accept=".json" onchange="app.importData(this.files[0])" class="hidden"></label></div><div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><div class="flex items-center gap-2 mb-2"><i class="fa-solid fa-circle-info text-primary text-xs"></i><span class="text-xs font-medium text-gray-700 dark:text-gray-300">Informações:</span></div><div class="space-y-1 text-xs text-gray-600 dark:text-gray-400"><div class="flex items-center gap-2"><i class="fa-regular fa-file-code w-4"></i><span>Exporta todos os dados: clientes, serviços, orçamentos e configurações</span></div><div class="flex items-center gap-2"><i class="fa-regular fa-clock w-4"></i><span>Backups automáticos mantêm histórico das últimas 20 versões</span></div><div class="flex items-center gap-2"><i class="fa-regular fa-folder-open w-4"></i><span>Arquivo exportado no formato JSON compatível com o sistema</span></div></div></div><button onclick="app.showBackupHistory()" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors border-t border-gray-200 dark:border-gray-700 pt-4"><i class="fa-solid fa-clock-rotate-left"></i><span>Ver histórico de backups automáticos</span><i class="fa-solid fa-chevron-right text-xs"></i></button></div></div>`;
  },
  
  exportData() {
    const data = { version: '3.0', exportDate: new Date().toISOString(), settings: this.settings, clients: this.clients, services: this.services, budgets: this.budgets };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `designer_budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('Dados exportados com sucesso!');
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
          Store.state.services = data.services || initialServices;
          Store.state.budgets = data.budgets || [];
          Store.save();
          Toast.success('Dados importados com sucesso!');
          this.renderClients();
          this.renderServicesList();
          this.renderBudgetsList();
          this.updateDashboard();
          this.renderGoals();
        } else { Toast.error('Arquivo inválido'); }
      } catch (error) { Toast.error('Erro ao importar arquivo'); }
    };
    reader.readAsText(file);
  },
  
  showBackupHistory() {
    const backups = Store.getBackups();
    const list = document.getElementById('backup-history-list');
    if (!list) return;
    if (backups.length === 0) {
      list.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400"><i class="fa-solid fa-database text-3xl mb-2 opacity-50"></i><p>Nenhum backup automático encontrado</p><p class="text-sm mt-2">Os backups são criados automaticamente a cada 5 minutos</p></div>`;
    } else {
      list.innerHTML = backups.slice().reverse().map(b => `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><div><p class="text-sm font-medium">Backup de ${new Date(b.timestamp).toLocaleDateString('pt-BR')}</p><p class="text-xs text-gray-500 dark:text-gray-400">${new Date(b.timestamp).toLocaleTimeString('pt-BR')}</p><p class="text-xs text-gray-500 mt-1">${Object.keys(b.data).length} coleções • ${b.data.clients?.length || 0} clientes • ${b.data.budgets?.length || 0} orçamentos</p></div><button onclick="app.restoreBackup('${b.timestamp}')" class="px-3 py-1 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors">Restaurar</button></div>`).join('');
    }
    this.openModal('backup-modal');
  },
  
  restoreBackup(timestamp) {
    if (confirm('Restaurar este backup? Os dados atuais serão substituídos.')) {
      if (Store.restoreBackup(timestamp)) {
        Toast.success('Backup restaurado com sucesso!');
        this.updateUIFromStore();
        this.renderClients();
        this.renderServicesList();
        this.renderBudgetsList();
        this.updateDashboard();
        this.renderGoals();
        this.closeModal('backup-modal');
      } else { Toast.error('Erro ao restaurar backup'); }
    }
  },
  
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
  // Verificar se os elementos existem
  const monthlyIncomeEl = document.getElementById('calc-monthly-income');
  const hoursPerDayEl = document.getElementById('calc-hours-per-day');
  const daysPerWeekEl = document.getElementById('calc-days-per-week');
  const vacationWeeksEl = document.getElementById('calc-vacation-weeks');
  const weeksYearEl = document.getElementById('calc-weeks-year');
  const hoursYearEl = document.getElementById('calc-hours-year');
  const annualIncomeEl = document.getElementById('calc-annual-income');
  const hourlyRateEl = document.getElementById('calc-hourly-rate');
  
  // Se os elementos não existirem, retorna valor padrão
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
  Toast.success('Valor/hora calculado: R$ ' + hourlyRate.toFixed(2));
  return hourlyRate;
},
  
  applyCalculatedHourlyRate() {
  if (!this.lastCalculatedRate) { this.lastCalculatedRate = this.calcHourlyRate(); }
  const rate = this.lastCalculatedRate;
  this.settings.hourlyRate = Math.round(rate);
  const settingInput = document.getElementById('settingHourlyRate');
  if (settingInput) settingInput.value = Math.round(rate);
  Store.save();
  Toast.success('Valor/hora aplicado: R$ ' + rate.toFixed(2));
  const budgetHourly = document.getElementById('budget-hourly');
  if (budgetHourly) { budgetHourly.value = Math.round(rate); this.updateBudgetTotal(); }
},
  
  calcProjectPrice() {
  // Verificar se os elementos existem
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
  
  updateDashboard() {
    console.log('Atualizando dashboard...');
    const budgets = this.dateFilterActive ? this.filteredBudgets : this.budgets;
    const total = budgets.length;
    const revenue = budgets.reduce((sum, b) => sum + (b.total || 0), 0);
    const paid = budgets.filter(b => b.status === 'pago').reduce((sum, b) => sum + (b.total || 0), 0);
    const totalEl = document.getElementById('stat-total');
    const revenueEl = document.getElementById('stat-revenue');
    const receiptEl = document.getElementById('stat-receipt');
    if (totalEl) totalEl.textContent = total;
    if (revenueEl) revenueEl.textContent = 'R$ ' + revenue.toFixed(2).replace('.', ',');
    if (receiptEl) receiptEl.textContent = 'R$ ' + paid.toFixed(2).replace('.', ',');
    const statusCounts = {
      em_processo: budgets.filter(b => b.status === 'em_processo').length,
      aprovado: budgets.filter(b => b.status === 'aprovado').length,
      nao_aprovado: budgets.filter(b => b.status === 'nao_aprovado').length,
      alterado: budgets.filter(b => b.status === 'alterado').length,
      concluido: budgets.filter(b => b.status === 'concluido').length,
      pago: budgets.filter(b => b.status === 'pago').length
    };
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
    this.renderRecentBudgets(budgets);
    this.initCharts();
  },
  
  renderRecentBudgets(budgets) {
    const recentList = document.getElementById('recent-budgets-list');
    const recentEmpty = document.getElementById('recent-budgets-empty');
    if (!recentList || !recentEmpty) return;
    const recent = budgets.slice(-5).reverse();
    if (recent.length === 0) {
      recentList.innerHTML = '';
      recentEmpty.classList.remove('hidden');
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
        return `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="font-medium truncate">${b.clientName}</span><span class="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">#${b.id?.toString().slice(-4)}</span></div><div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><span>R$ ${b.total?.toFixed(2)}</span><span>•</span><span>${b.services?.length || 0} serviços</span><span>•</span><span><i class="fa-regular fa-calendar mr-1"></i>${b.date}</span></div></div><span class="ml-4 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusClass}">${this.getStatusLabel(b.status)}</span></div>`;
      }).join('');
    }
  },
  
  filterDashboardByDate() {
    const from = document.getElementById('dashboard-date-from')?.value;
    const to = document.getElementById('dashboard-date-to')?.value;
    if (!from || !to) { Toast.error('Selecione ambas as datas'); return; }
    this.dateFilterActive = true;
    this.filteredBudgets = this.budgets.filter(b => { const date = new Date(b.date); return date >= new Date(from) && date <= new Date(to); });
    this.updateDashboard();
    Toast.success(`Filtro aplicado: ${this.filteredBudgets.length} orçamentos`);
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
    if (filterEl) { filterEl.value = status; this.navigate('budgets'); setTimeout(() => this.filterBudgetsByStatus(), 100); }
  },
  
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
      if (typeof Chart === 'undefined') { console.warn('Chart.js não carregado'); return; }
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
        data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#FFA500', '#218040', '#c91530', '#a84d2f', '#2d8a8a', '#1a6b4d'], borderWidth: 0, cutout: isMobile ? '35%' : '30%', hoverOffset: 10, spacing: 2 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#fff' : '#000', font: { size: isMobile ? 10 : 11, weight: 'normal' }, boxWidth: isMobile ? 8 : 10, boxHeight: isMobile ? 8 : 10, padding: isMobile ? 6 : 10, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { bodyFont: { size: isMobile ? 11 : 12 }, titleFont: { size: isMobile ? 11 : 12 }, padding: isMobile ? 6 : 8, callbacks: { label: (context) => { const label = context.label || ''; const value = context.raw || 0; const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0; return `${label}: ${value} (${percentage}%)`; } } } }, layout: { padding: { top: isMobile ? 5 : 10, bottom: isMobile ? 5 : 10, left: isMobile ? 5 : 10, right: isMobile ? 5 : 10 } } } });
      const revenueCtx = revenueCanvas.getContext('2d');
      const last6Months = this.getLast6MonthsRevenue();
      this.charts.revenue = new Chart(revenueCtx, { type: 'line', data: { labels: last6Months.labels, datasets: [{ label: 'Receita (R$)', data: last6Months.values, borderColor: '#2d8a8a', backgroundColor: 'rgba(45, 138, 138, 0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#2d8a8a', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',') } } }, scales: { y: { beginAtZero: true, ticks: { callback: (value) => 'R$ ' + value.toFixed(2).replace('.', ',') } } } } });
        console.log('✅ Gráficos inicializados com sucesso');
      } catch (error) { console.warn('Erro ao inicializar gráficos:', error); }
    }, 300);
},
  
  destroyCharts() {
    if (this.charts) {
      if (this.charts.status) { this.charts.status.destroy(); this.charts.status = null; }
      if (this.charts.revenue) { this.charts.revenue.destroy(); this.charts.revenue = null; }
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
      const revenue = this.budgets.filter(b => { const budgetDate = new Date(b.date); return budgetDate.getMonth() === date.getMonth() && budgetDate.getFullYear() === date.getFullYear(); }).reduce((sum, b) => sum + (b.total || 0), 0);
      values.push(revenue);
    }
    return { labels, values };
  },
  
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
    this.currentBudgetPalettes = colorUtils.generatePaletteModels(color);
    this.updatePaletteDisplay();
  },
  
  updatePaletteDisplay() {
    const modelSelect = document.getElementById('paletteModel');
    if (!modelSelect) return;
    const model = modelSelect.value;
    const map = { monochromatic: 'monocromatica', analogous: 'analogica', complementary: 'complementar', triadic: 'triadica', tetradic: 'tetradica' };
    const key = map[model] || model;
    const colors = this.currentBudgetPalettes[key] || [];
    const grid = document.getElementById('generatedPalette');
    if (!grid) return;
    if (colors.length === 0) { grid.innerHTML = '<p class="text-center text-gray-500 col-span-5">Gere uma paleta primeiro</p>'; return; }
    grid.innerHTML = colors.map(color => `<div class="aspect-square rounded-lg shadow-md cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300 relative overflow-hidden group" style="background-color: ${color};" onclick="navigator.clipboard.writeText('${color}'); Toast.success('Copiado: ${color}')"><div class="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm text-white text-xs font-mono py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">${color}</div></div>`).join('');
  },
  
  randomizeBaseColor() {
    const input = document.getElementById('paletteColor');
    if (!input) return;
    const hex = '#' + Array.from({length:3}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
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
    grid.innerHTML = colors.map(c => `<div class="text-center cursor-pointer group" onclick="navigator.clipboard.writeText('${c.color}'); Toast.success('Copiado: ${c.color}')"><div class="w-full h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-1 group-hover:scale-105 transition-transform duration-300" style="background-color: ${c.color}"></div><div class="text-xs font-semibold">${c.name}</div><div class="text-xs text-gray-500 dark:text-gray-400">${c.color}</div></div>`).join('');
  },
  
  copyPaletteHexCodes() {
    const modelSelect = document.getElementById('paletteModel');
    const model = modelSelect.value;
    const map = { monochromatic: 'monocromatica', analogous: 'analogica', complementary: 'complementar', triadic: 'triadica', tetradic: 'tetradica' };
    const key = map[model] || model;
    const colors = this.currentBudgetPalettes[key] || [];
    const hexCodes = colors.join('\n');
    navigator.clipboard.writeText(hexCodes).then(() => { Toast.success('Códigos HEX copiados!'); });
  },
  
  copyCustomPaletteHex() {
    const ids = ['customColor1','customColor2','customColor3','customColor4'];
    const values = ids.map(id => { const el = document.getElementById(id); return el ? el.value : ''; }).filter(Boolean);
    const list = values.join('\n');
    if (list) { navigator.clipboard.writeText(list).then(() => { Toast.success('Códigos HEX copiados!'); }); }
  },
  
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
    if (!client) { Toast.error('Cliente não encontrado'); return; }
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
    if (!name || !email) { Toast.error('Preencha nome e e-mail'); return; }
    if (this.editingClientId) {
      const clientData = { name, email, phone, company };
      Store.updateClient(this.editingClientId, clientData);
      Toast.success('Cliente atualizado com sucesso!');
      this.editingClientId = null;
    } else {
      const clientData = { name, email, phone, company, id: Date.now() };
      Store.addClient(clientData);
      Toast.success('Cliente adicionado com sucesso!');
    }
    this.closeModal('client-modal');
    this.renderClients();
  },
  
  removeClient(id) {
    if (confirm('Tem certeza que deseja remover este cliente?')) {
      Store.removeClient(id);
      this.renderClients();
      Toast.success('Cliente removido!');
    }
  },
  
  renderClients() {
    let filtered = this.clients;
    const searchTerm = this.clientSearchFilter?.toLowerCase() || '';
    if (searchTerm) { filtered = filtered.filter(c => c.name?.toLowerCase().includes(searchTerm) || c.email?.toLowerCase().includes(searchTerm)); }
    const list = document.getElementById('clients-list');
    const emptyState = document.getElementById('clients-empty-state');
    if (!list) return;
    if (filtered.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState?.classList.remove('hidden');
    } else {
      if (emptyState) emptyState?.classList.add('hidden');
      list.innerHTML = filtered.map(client => `<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div class="flex-1"><div class="flex items-center gap-2"><div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><i class="fa-solid fa-user text-primary"></i></div><div><h3 class="font-semibold">${this.escapeHtml(client.name || 'Sem nome')}</h3><p class="text-sm text-gray-600 dark:text-gray-400">${this.escapeHtml(client.email || 'Sem email')}</p></div></div><div class="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">${client.phone ? `<span><i class="fa-solid fa-phone mr-1"></i>${this.escapeHtml(client.phone)}</span>` : ''}${client.company ? `<span><i class="fa-solid fa-building mr-1"></i>${this.escapeHtml(client.company)}</span>` : ''}</div></div><div class="flex gap-2"><button onclick="app.editClient(${client.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm"><i class="fa-solid fa-pen mr-1"></i> Editar</button><button onclick="app.removeClient(${client.id})" class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm"><i class="fa-solid fa-trash mr-1"></i> Excluir</button></div></div>`).join('');
    }
    this.updateClientsCount();
  },
  
  filterClients() {
    this.clientSearchFilter = document.getElementById('client-search')?.value || '';
    this.renderClients();
  },
  
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
    if (!category || !name) { Toast.error('Preencha categoria e nome'); return; }
    if (id) { Store.updateService(parseInt(id), { category, name, price, type }); Toast.success('Serviço atualizado!'); }
    else { Store.addService({ category, name, price, type }); Toast.success('Serviço adicionado!'); }
    this.closeModal('service-modal');
    this.renderServicesList();
  },
  
  removeService(id) {
    if (confirm('Remover este serviço?')) { Store.removeService(id); this.renderServicesList(); }
  },
  
  renderServicesList() {
    console.log('Renderizando serviços...', this.services);
    const grouped = {};
    this.services.forEach(s => { if (!grouped[s.category]) grouped[s.category] = []; grouped[s.category].push(s); });
    const accordion = document.getElementById('services-accordion');
    if (!accordion) { console.error('Elemento services-accordion não encontrado!'); return; }
    if (Object.keys(grouped).length === 0) {
      accordion.innerHTML = `<div class="text-center py-12 text-gray-500 dark:text-gray-400 animate-fade-in"><i class="fa-solid fa-bullseye text-4xl mb-3 opacity-50"></i><p>Nenhum serviço cadastrado</p><button onclick="app.showAddServiceModal()" class="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"><i class="fa-solid fa-plus mr-2"></i>Adicionar Primeiro Serviço</button></div>`;
      return;
    }
    let html = '';
    Object.keys(grouped).sort().forEach((category, catIndex) => {
      html += `<div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden accordion-item animate-fade-in" style="animation-delay: ${catIndex * 0.1}s"><div class="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer" onclick="this.closest('.accordion-item').classList.toggle('active')"><span class="font-medium flex items-center gap-2"><i class="fa-regular fa-folder-open text-primary"></i>${category} <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">${grouped[category].length}</span></span><i class="fa-solid fa-chevron-down transform transition-transform duration-300 accordion-chevron"></i></div><div class="hidden p-4 space-y-2 bg-white dark:bg-gray-900 accordion-content">${grouped[category].map((s, index) => `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200" style="animation-delay: ${index * 0.05}s"><div><div class="font-medium">${s.name}</div><div class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><span>R$ ${s.price.toLocaleString('pt-BR')}</span><span class="w-1 h-1 bg-gray-400 rounded-full"></span><span>${s.type === 'hourly' ? 'por hora' : 'preço fixo'}</span></div></div><div class="flex gap-2"><button onclick="app.editService(${s.id})" class="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-600" title="Editar serviço"><i class="fa-solid fa-pen"></i></button><button onclick="app.removeService(${s.id})" class="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-600" title="Excluir serviço"><i class="fa-solid fa-trash"></i></button></div></div>`).join('')}<div class="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700"><button onclick="app.showAddServiceModal('${category}')" class="text-sm text-primary hover:underline flex items-center gap-1"><i class="fa-solid fa-plus"></i>Adicionar serviço em "${category}"</button></div></div></div>`;
    });
    accordion.innerHTML = html;
    console.log('✅ Serviços renderizados com sucesso!');
  },
  
  startNewBudget() {
    console.log('Iniciando novo orçamento...');
    this.navigate('budgets');
    this.isEditing = false;
    this.currentBudgetId = null;
    this.currentBudgetServices = [];
    this.paletteMode = 'generator';
    const select = document.getElementById('budget-client');
    if (select) { const options = this.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join(''); select.innerHTML = `<option value="">Selecione um cliente</option>${options}`; }
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
    if (select) { const options = this.clients.map(c => `<option value="${c.id}" ${c.id === budget.clientId ? 'selected' : ''}>${c.name}</option>`).join(''); select.innerHTML = `<option value="">Selecione um cliente</option>${options}`; }
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
    if (!clientId) { Toast.error('Selecione um cliente'); return; }
    const client = this.clients.find(c => c.id === parseInt(clientId));
    if (!client) { Toast.error('Cliente não encontrado'); return; }
    let subtotal = 0;
    this.currentBudgetServices.forEach(s => { const price = s.customPrice !== null ? s.customPrice : s.price; subtotal += price * s.qty; });
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
      clientId: parseInt(clientId), clientName: client.name, services: this.currentBudgetServices,
      notes: document.getElementById('budget-notes')?.value, status: document.getElementById('budget-status')?.value,
      date: document.getElementById('budget-date')?.value, projectName: document.getElementById('budget-project-name')?.value,
      deadline: parseInt(document.getElementById('budget-deadline')?.value) || 7, paymentTerms: document.getElementById('budget-payment-terms')?.value,
      validity: parseInt(document.getElementById('budget-validity')?.value) || 30, subtotal, hoursWorked, hoursCost, total,
      paletteSource: this.paletteMode, customPalette, generatedPalette, paletteModel
    };
    if (this.isEditing && this.currentBudgetId) { Store.updateBudget(this.currentBudgetId, budgetData); Toast.success('Orçamento atualizado!'); }
    else { Store.addBudget(budgetData); Toast.success('Orçamento criado!'); }
    this.closeModal('budget-modal');
    this.updateDashboard();
    this.renderBudgetsList();
  },
  
  deleteBudget(id) {
    if (confirm('Excluir este orçamento?')) { Store.removeBudget(id); this.updateDashboard(); this.renderBudgetsList(); }
  },
  
  filterBudgetsByStatus() { this.renderBudgetsList(); },
  
  renderBudgetsList() {
    const statusFilter = document.getElementById('budget-filter-status')?.value;
    let filtered = this.budgets;
    if (statusFilter) filtered = filtered.filter(b => b.status === statusFilter);
    const list = document.getElementById('budgets-list');
    if (!list) return;
    if (filtered.length === 0) { list.innerHTML = `<div class="text-center py-12 text-gray-500 dark:text-gray-400"><i class="fa-solid fa-clipboard-list text-4xl mb-3 opacity-50"></i><p>Nenhum orçamento encontrado</p></div>`; return; }
    list.innerHTML = filtered.map(b => {
      const statusClass = { 'em_processo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 'aprovado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 'nao_aprovado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 'alterado': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 'concluido': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 'pago': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' }[b.status] || 'bg-gray-100 text-gray-800';
      return `<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><span class="font-semibold">${b.projectName || 'Projeto sem nome'}</span><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">#${b.id?.toString().slice(-4)}</span></div><p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${b.clientName} • R$ ${b.total.toFixed(2)} • ${b.services?.length || 0} serviços • ${b.date}</p><span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${this.getStatusLabel(b.status)}</span></div><div class="flex gap-2 self-end sm:self-auto"><button onclick="app.editBudget(${b.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"><i class="fa-solid fa-pen mr-1"></i> Editar</button><button onclick="app.generatePDF(${b.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"><i class="fa-regular fa-file-pdf mr-1"></i> PDF</button><button onclick="app.deleteBudget(${b.id})" class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm transition-all duration-200 transform hover:scale-105"><i class="fa-solid fa-trash mr-1"></i> Excluir</button></div></div>`;
    }).join('');
  },
  
  getStatusLabel(status) {
    const labels = { em_processo: 'Em Processo', aprovado: 'Aprovado', nao_aprovado: 'Não Aprovado', alterado: 'Alterado', concluido: 'Concluído', pago: 'Pago' };
    return labels[status] || status;
  },
  
  initializeCategoryFilter() {
    const categories = [...new Set(this.services.map(s => s.category))].sort();
    const select = document.getElementById('service-category-filter');
    if (!select) return;
    select.innerHTML = '<option value="">Todas as categorias</option>';
    categories.forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; select.appendChild(option); });
  },
  
  filterServicesByCategory() { this.currentBudgetFilter.category = document.getElementById('service-category-filter')?.value || ''; this.displayFilteredServices(); },
  
  searchServices() { this.currentBudgetFilter.search = document.getElementById('service-search')?.value.toLowerCase() || ''; this.displayFilteredServices(); },
  
  displayFilteredServices() {
    const filter = this.currentBudgetFilter;
    let filtered = this.services.filter(s => { const categoryMatch = !filter.category || s.category === filter.category; const searchMatch = !filter.search || s.name.toLowerCase().includes(filter.search); return categoryMatch && searchMatch; });
    const container = document.getElementById('services-list-container');
    if (!container) return;
    if (filtered.length === 0) { container.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400"><i class="fa-solid fa-search text-3xl mb-2 opacity-50"></i><p class="text-sm">Nenhum serviço encontrado</p></div>`; return; }
    container.innerHTML = filtered.map(service => {
      const current = this.currentBudgetServices.find(s => s.id === service.id);
      const qty = current ? current.qty : 0;
      return `<div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2"><div class="flex justify-between items-center"><span class="font-medium">${service.name}</span><span class="text-sm text-gray-600 dark:text-gray-400">R$ ${service.price}</span></div><div class="flex items-center gap-2"><button onclick="app.updateServiceQty(${service.id}, ${qty - 1})" class="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors"><i class="fa-solid fa-minus text-xs"></i></button><input type="number" value="${qty}" onchange="app.updateServiceQty(${service.id}, this.value)" class="w-16 text-center px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"><button onclick="app.updateServiceQty(${service.id}, ${qty + 1})" class="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors"><i class="fa-solid fa-plus text-xs"></i></button>${qty > 0 ? `<span class="ml-auto text-sm font-semibold">Total: R$ ${((current?.customPrice || service.price) * qty).toFixed(2)}</span>` : ''}</div>${qty > 0 ? `<div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600"><label class="text-xs text-gray-600 dark:text-gray-400">Preço:</label><input type="number" value="${current?.customPrice || service.price}" onchange="app.updateServicePrice(${service.id}, this.value)" class="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"><button onclick="app.resetServicePrice(${service.id})" class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors">Reset</button></div>` : ''}</div>`;
    }).join('');
    this.updateSelectedServicesSummary();
    this.updateBudgetTotal();
  },
  
  updateServiceQty(serviceId, qty) {
    qty = Math.max(0, parseInt(qty) || 0);
    const index = this.currentBudgetServices.findIndex(s => s.id === serviceId);
    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;
    if (qty === 0) { if (index !== -1) this.currentBudgetServices.splice(index, 1); }
    else { if (index !== -1) { this.currentBudgetServices[index].qty = qty; } else { this.currentBudgetServices.push({ ...service, qty, customPrice: null }); } }
    this.displayFilteredServices();
  },
  
  updateServicePrice(serviceId, price) {
    const service = this.currentBudgetServices.find(s => s.id === serviceId);
    if (service) { service.customPrice = parseFloat(price) || null; }
    this.updateSelectedServicesSummary();
    this.updateBudgetTotal();
  },
  
  resetServicePrice(serviceId) {
    const service = this.currentBudgetServices.find(s => s.id === serviceId);
    if (service) { service.customPrice = null; }
    this.updateSelectedServicesSummary();
    this.updateBudgetTotal();
    this.displayFilteredServices();
  },
  
  updateSelectedServicesSummary() {
    const summary = document.getElementById('selected-services-summary');
    if (!summary) return;
    if (this.currentBudgetServices.length === 0) { summary.innerHTML = '<span class="text-sm text-gray-500 dark:text-gray-400">Nenhum serviço selecionado</span>'; return; }
    summary.innerHTML = this.currentBudgetServices.map(s => { const price = s.customPrice !== null ? s.customPrice : s.price; const total = (price * s.qty).toFixed(2); return `<div class="flex justify-between text-sm"><span>${s.name} x${s.qty}</span><span class="font-medium">R$ ${total}</span></div>`; }).join('');
  },
  
  updateBudgetTotal() {
    let subtotal = 0;
    this.currentBudgetServices.forEach(s => { const price = s.customPrice !== null ? s.customPrice : s.price; subtotal += price * s.qty; });
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
    const updates = { name: nameEl ? nameEl.value : '', email: emailEl ? emailEl.value : '', hourlyRate: parseInt(hourlyEl?.value) || 150, theme: darkModeEl?.checked ? 'dark' : 'light' };
    Store.state.settings = { ...Store.state.settings, ...updates };
    Store.save();
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    if (userNameEl) userNameEl.textContent = updates.name;
    if (userAvatarEl) userAvatarEl.textContent = (updates.name || '').charAt(0).toUpperCase();
    Toast.success('Configurações salvas!');
  },
  
  generatePDF(budgetId) {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) { Toast.error('Orçamento não encontrado'); return; }
    pdfTemplate.gerarOrcamentoPDF(budget, this.settings);
  },
  
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
  
  updateBudgetClientSelect(clientId) {
    const select = document.getElementById('budget-client');
    if (!select) return;
    const options = this.clients.map(c => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${c.name}</option>`).join('');
    select.innerHTML = `<option value="">Selecione um cliente</option>${options}`;
    if (clientId) select.value = clientId;
    const client = this.clients.find(c => c.id === clientId);
    if (client && this.currentBudgetId) this.currentBudgetClientName = client.name;
  },
  
  openModal(id) {
    console.log('Abrindo modal:', id);
    const modal = document.getElementById(id);
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); modal.style.zIndex = '10000'; console.log('✅ Modal aberto com sucesso'); }
    else { console.error('❌ Erro: Modal não encontrado com o ID:', id); }
  },
  
  closeModal(id) {
    console.log('Fechando modal:', id);
    const modal = document.getElementById(id);
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); console.log('✅ Modal fechado'); }
  },
  
  updateAboutStats() {
    const totalServices = document.getElementById('about-total-services');
    const totalClients = document.getElementById('about-total-clients');
    const totalBudgets = document.getElementById('about-total-budgets');
    if (totalServices) totalServices.textContent = this.services?.length || 51;
    if (totalClients) totalClients.textContent = this.clients?.length || 0;
    if (totalBudgets) totalBudgets.textContent = this.budgets?.length || 0;
  },
  
  updateClientsCount() {
    const count = this.clients.length;
    const countSpan = document.getElementById('clients-count');
    const resultsSpan = document.getElementById('clients-results-count');
    if (countSpan) countSpan.textContent = count;
    if (resultsSpan) { const searchTerm = this.clientSearchFilter?.toLowerCase() || ''; if (searchTerm) { const visibleCount = document.querySelectorAll('#clients-list .bg-white').length; resultsSpan.textContent = visibleCount; } else { resultsSpan.textContent = count; } }
  },
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// EXPOSIÇÃO GLOBAL
// ============================================
window.app = app;
window.colorUtils = colorUtils;
window.Toast = Toast;

// ============================================
// INICIALIZAÇÃO
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}