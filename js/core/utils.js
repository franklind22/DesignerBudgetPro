/**
 * UTILS MODULE
 * Funções utilitárias compartilhadas entre todas as páginas
 */

const Utils = (function() {
    'use strict';
    
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
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
    
    // ============================================
    // STRING UTILITIES
    // ============================================
    
    /**
     * Escapa HTML para prevenir XSS
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
    
    // ============================================
    // FORMATTING UTILITIES
    // ============================================
    
    /**
     * Formata valor para BRL
     */
    function formatBRL(value) {
        const n = parseFloat(value) || 0;
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    
    /**
     * Formata data (YYYY-MM-DD) para DD/MM/YYYY
     */
    function formatDate(dateString) {
        if (!dateString) return '—';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    /**
     * Formata data para exibição em PDF (mesmo formato)
     */
    function formatDateForPDF(dateString) {
        if (!dateString) return '—';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    // ============================================
    // COLOR UTILITIES
    // ============================================
    
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
    
    // ============================================
    // THEME UTILITIES
    // ============================================
    
    /**
     * Obtém a cor primária atual do tema
     */
    function getPrimaryColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return (rootStyles.getPropertyValue('--primary') || '').trim() || '#2d8a8a';
    }
    
    /**
     * Obtém todas as cores do tema atual
     */
    function getThemeColors() {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        return {
            primary: styles.getPropertyValue('--primary').trim() || '#2d8a8a',
            primaryDark: styles.getPropertyValue('--primary-dark').trim() || '#1e5f5f',
            primaryLight: styles.getPropertyValue('--primary-light').trim() || '#e6f3f3'
        };
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    return {
        // Toast
        toast: Toast,
        
        // String
        escapeHtml,
        
        // Formatting
        formatBRL,
        formatDate,
        formatDateForPDF,
        
        // Colors
        colorUtils,
        getPrimaryColor,
        getThemeColors,
        
        // Alias para compatibilidade
        fmtCurrency: formatBRL,
        fmtDate: formatDate
    };
    
})();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    // Manter compatibilidade com código existente
    window.Toast = Utils.toast;
    window.colorUtils = Utils.colorUtils;
}