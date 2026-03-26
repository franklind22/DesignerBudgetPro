/**
 * THEME MANAGER MODULE
 * Gerencia tema claro/escuro e cores personalizadas
 */

const ThemeManager = (function() {
    'use strict';
    
    // ============================================
    // CONSTANTES
    // ============================================
    
    const STORAGE_KEY_THEME = 'dbp_theme_mode';
    const STORAGE_KEY_COLORS = 'dbp_theme_colors';
    const DEFAULT_COLORS = {
        primary: '#2d8a8a',
        primaryDark: '#1e5f5f',
        primaryLight: '#e6f3f3'
    };
    
    // ============================================
    // PRIVADO
    // ============================================
    
    let _currentColors = { ...DEFAULT_COLORS };
    let _listeners = [];
    
    /**
     * Aplica as cores atuais ao documento
     */
    function _applyColors() {
        const root = document.documentElement;
        root.style.setProperty('--primary', _currentColors.primary);
        root.style.setProperty('--primary-dark', _currentColors.primaryDark);
        root.style.setProperty('--primary-light', _currentColors.primaryLight);
        
        // Disparar evento para outras partes do sistema
        document.dispatchEvent(new CustomEvent('themeColorsChanged', { 
            detail: { colors: _currentColors }
        }));
    }
    
    /**
     * Carrega cores salvas do localStorage
     */
    function _loadSavedColors() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_COLORS);
            if (saved) {
                const parsed = JSON.parse(saved);
                _currentColors = { ...DEFAULT_COLORS, ...parsed };
                _applyColors();
                return true;
            }
        } catch (e) {
            console.warn('Erro ao carregar cores:', e);
        }
        return false;
    }
    
    /**
     * Salva cores atuais no localStorage
     */
    function _saveColors() {
        try {
            localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(_currentColors));
        } catch (e) {
            console.warn('Erro ao salvar cores:', e);
        }
    }
    
    /**
     * Aplica o modo escuro/claro
     */
    function _applyThemeMode(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
        document.dispatchEvent(new CustomEvent('themeModeChanged', { 
            detail: { isDark }
        }));
    }
    
    /**
     * Carrega o modo salvo ou detecta preferência do sistema
     */
    function _loadSavedThemeMode() {
        const saved = localStorage.getItem(STORAGE_KEY_THEME);
        if (saved === 'dark') {
            _applyThemeMode(true);
            return true;
        } else if (saved === 'light') {
            _applyThemeMode(false);
            return false;
        }
        
        // Detectar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        _applyThemeMode(prefersDark);
        return prefersDark;
    }
    
    /**
     * Escuta mudanças na preferência do sistema
     */
    function _setupSystemPreferenceListener() {
        const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMedia.addEventListener('change', (e) => {
            // Só aplicar se não houver preferência salva
            if (!localStorage.getItem(STORAGE_KEY_THEME)) {
                _applyThemeMode(e.matches);
            }
        });
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    return {
        /**
         * Inicializa o ThemeManager
         */
        init() {
            _loadSavedColors();
            _loadSavedThemeMode();
            _setupSystemPreferenceListener();
            console.log('✅ ThemeManager inicializado');
        },
        
        /**
         * Obtém as cores atuais
         */
        getColors() {
            return { ..._currentColors };
        },
        
        /**
         * Define novas cores e persiste
         */
        setColors(colors) {
            _currentColors = { ...DEFAULT_COLORS, ...colors };
            _applyColors();
            _saveColors();
        },
        
        /**
         * Restaura as cores padrão
         */
        resetColors() {
            _currentColors = { ...DEFAULT_COLORS };
            _applyColors();
            _saveColors();
        },
        
        /**
         * Obtém o modo atual (true = dark, false = light)
         */
        getThemeMode() {
            return document.documentElement.classList.contains('dark');
        },
        
        /**
         * Alterna entre modo claro e escuro
         */
        toggleThemeMode() {
            const isDark = !this.getThemeMode();
            _applyThemeMode(isDark);
            return isDark;
        },
        
        /**
         * Define o modo específico
         */
        setThemeMode(isDark) {
            _applyThemeMode(isDark);
        },
        
        /**
         * Adiciona listener para mudanças de tema
         */
        addListener(callback) {
            if (typeof callback === 'function') {
                _listeners.push(callback);
            }
        },
        
        /**
         * Remove listener
         */
        removeListener(callback) {
            const index = _listeners.indexOf(callback);
            if (index !== -1) _listeners.splice(index, 1);
        },
        
        /**
         * Ajusta brilho de uma cor (utilitário)
         */
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
            } catch (e) {
                return hex;
            }
        }
    };
    
})();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
}