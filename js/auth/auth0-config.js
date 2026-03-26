/**
 * AUTH0 CONFIGURATION
 * Configuração centralizada do Auth0
 */

// ============================================
// CONFIGURAÇÕES DO AUTH0
// ============================================

const AUTH0_CONFIG = {
    domain: 'SEU_DOMINIO.auth0.com',     // Substitua pelo seu domínio Auth0
    clientId: 'SEU_CLIENT_ID',           // Substitua pelo seu Client ID
    audience: 'https://designerbudgetpro/api',
    scope: 'openid profile email',
    redirectUri: window.location.origin + '/callback.html'
};

// ============================================
// CLASSE DE AUTENTICAÇÃO
// ============================================

class Auth0Service {
    constructor() {
        this.auth0 = null;
        this.isInitialized = false;
    }
    
    /**
     * Inicializa o cliente Auth0
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Carregar o SDK do Auth0 dinamicamente
            await this.loadAuth0SDK();
            
            // Criar instância do cliente Auth0
            this.auth0 = new auth0.WebAuth({
                domain: AUTH0_CONFIG.domain,
                clientID: AUTH0_CONFIG.clientId,
                redirectUri: AUTH0_CONFIG.redirectUri,
                responseType: 'token id_token',
                scope: AUTH0_CONFIG.scope,
                audience: AUTH0_CONFIG.audience
            });
            
            this.isInitialized = true;
            console.log('✅ Auth0 inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar Auth0:', error);
        }
    }
    
    /**
     * Carrega o SDK do Auth0 dinamicamente
     */
    loadAuth0SDK() {
        return new Promise((resolve, reject) => {
            if (typeof auth0 !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.auth0.com/js/auth0/9.14/auth0.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Realiza login
     */
    login() {
        if (!this.isInitialized) {
            console.error('Auth0 não inicializado');
            return;
        }
        
        this.auth0.authorize();
    }
    
    /**
     * Processa o callback após login
     */
    handleCallback() {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('Auth0 não inicializado'));
                return;
            }
            
            this.auth0.parseHash((err, authResult) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (authResult && authResult.accessToken && authResult.idToken) {
                    // Salvar tokens
                    localStorage.setItem('auth0_access_token', authResult.accessToken);
                    localStorage.setItem('auth0_id_token', authResult.idToken);
                    
                    // Obter perfil do usuário
                    this.auth0.client.userInfo(authResult.accessToken, (userErr, profile) => {
                        if (userErr) {
                            reject(userErr);
                            return;
                        }
                        
                        // Salvar dados do usuário
                        const userData = {
                            userId: profile.sub,
                            name: profile.name || profile.nickname,
                            email: profile.email,
                            picture: profile.picture,
                            createdAt: new Date().toISOString()
                        };
                        
                        localStorage.setItem('dbp_user', JSON.stringify(userData));
                        localStorage.setItem('dbp_last_user', userData.userId);
                        
                        resolve(userData);
                    });
                } else {
                    reject(new Error('Nenhum resultado de autenticação'));
                }
            });
        });
    }
    
    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated() {
        const token = localStorage.getItem('auth0_access_token');
        return !!token;
    }
    
    /**
     * Obtém os dados do usuário atual
     */
    getCurrentUser() {
        const userData = localStorage.getItem('dbp_user');
        if (!userData) return null;
        
        try {
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Realiza logout
     */
    logout() {
        // Limpar dados locais
        localStorage.removeItem('auth0_access_token');
        localStorage.removeItem('auth0_id_token');
        localStorage.removeItem('dbp_user');
        localStorage.removeItem('dbp_last_user');
        
        // Redirecionar para logout do Auth0
        const logoutUrl = `https://${AUTH0_CONFIG.domain}/v2/logout?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(window.location.origin + '/login.html')}`;
        window.location.href = logoutUrl;
    }
    
    /**
     * Renova o token automaticamente
     */
    scheduleTokenRenewal() {
        // Verificar token a cada 30 minutos
        setInterval(() => {
            const token = localStorage.getItem('auth0_access_token');
            if (token) {
                // Aqui você pode implementar renovação de token
                console.log('Verificando token...');
            }
        }, 30 * 60 * 1000);
    }
}

// Criar instância global
const Auth0 = new Auth0Service();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.Auth0 = Auth0;
}