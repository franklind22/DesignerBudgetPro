/**
 * AUTH0 CONFIGURATION
 * Configuração centralizada do Auth0
 */

// ============================================
// CONFIGURAÇÕES DO AUTH0
// ============================================

const AUTH0_CONFIG = {
    domain: 'dev-wubvk8jpjm83zr75.us.auth0.com',
    clientId: 'e3OghAJL1TNIs90G2toGsD1X3sBjggbX',
    audience: 'https://designerbudgetpro/api',
    scope: 'openid profile email',
    redirectUri: window.location.origin + '/callback.html'
};

// ============================================
// CLASSE DE AUTENTICAÇÃO AUTH0
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
            await this.loadAuth0SDK();
            
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
            this.init().then(() => this.auth0.authorize());
            return;
        }
        this.auth0.authorize();
    }
    
    /**
     * Login com Google (conexão específica)
     */
    loginWithGoogle() {
        if (!this.isInitialized) {
            this.init().then(() => {
                this.auth0.authorize({
                    connection: 'google-oauth2'
                });
            });
            return;
        }
        this.auth0.authorize({
            connection: 'google-oauth2'
        });
    }
    
    /**
     * Login com GitHub
     */
    loginWithGitHub() {
        if (!this.isInitialized) {
            this.init().then(() => {
                this.auth0.authorize({
                    connection: 'github'
                });
            });
            return;
        }
        this.auth0.authorize({
            connection: 'github'
        });
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
                            name: profile.name || profile.nickname || profile.email.split('@')[0],
                            email: profile.email,
                            picture: profile.picture,
                            createdAt: new Date().toISOString()
                        };
                        
                        localStorage.setItem('dbp_user', JSON.stringify(userData));
                        localStorage.setItem('dbp_last_user', userData.userId);
                        
                        console.log('✅ Usuário autenticado:', userData.email);
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
        if (!token) return false;
        
        // Verificar expiração básica (opcional)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp < Date.now() / 1000) {
                return false;
            }
        } catch (e) {
            // Ignorar erros de parsing
        }
        
        return true;
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
        const user = this.getCurrentUser();
        console.log('👋 Logout:', user?.email || 'usuário');
        
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
     * Cria usuário demo (apenas para teste - no Auth0 isso é gerenciado pelo dashboard)
     */
    createDemoUser() {
        return new Promise((resolve, reject) => {
            // No Auth0, não criamos usuários diretamente
            // O usuário deve se registrar via formulário de cadastro do Auth0
            reject(new Error('Para criar conta, use o botão "Sign Up" na tela de login do Auth0'));
        });
    }
}

// Criar instância global
const Auth0 = new Auth0Service();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.Auth0 = Auth0;
    // Manter compatibilidade com código existente
    window.Auth = Auth0;
}
