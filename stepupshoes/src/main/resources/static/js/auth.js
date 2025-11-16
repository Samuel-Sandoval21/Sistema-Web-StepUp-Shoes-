/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
// static/js/auth.js - Sistema completo de autenticación StepUp Shoes

/**
 * Sistema de autenticación completo
 * Maneja login, registro, validación y gestión de sesiones
 */

class AuthSystem {
    constructor() {
        this.state = {
            isAuthenticated: false,
            currentUser: null,
            token: null
        };
        
        this.elements = {
            loginForm: null,
            registerForm: null,
            loginPopup: null,
            registerPopup: null
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Inicializando sistema de autenticación StepUp Shoes...');
        
        this.getDOMElements();
        this.checkAuthStatus();
        this.setupEventListeners();
        this.setupRealTimeValidation();
        
        console.log('✅ Sistema de autenticación inicializado');
    }

    getDOMElements() {
        this.elements.loginForm = document.getElementById('loginForm');
        this.elements.registerForm = document.getElementById('registerForm');
        this.elements.loginPopup = document.getElementById('popup-login');
        this.elements.registerPopup = document.getElementById('popup-registro');
    }

    setupEventListeners() {
        // Formularios
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Cierre de popups
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-close') || 
                e.target.classList.contains('auth-close')) {
                this.closeAllPopups();
            }
        });

        // Cierre con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllPopups();
            }
        });
    }

    setupRealTimeValidation() {
        // Validación de email en tiempo real
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateEmail(e.target));
            input.addEventListener('input', (e) => this.clearFieldError(e.target));
        });

        // Validación de contraseña en tiempo real
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validatePassword(e.target));
            input.addEventListener('input', (e) => {
                this.clearFieldError(e.target);
                this.updatePasswordStrength(e.target.value);
            });
        });

        // Toggle visibilidad de contraseña
        this.setupPasswordToggle();
    }

    setupPasswordToggle() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-password') || 
                e.target.closest('.toggle-password')) {
                const button = e.target.classList.contains('toggle-password') ? 
                    e.target : e.target.closest('.toggle-password');
                const input = button.previousElementSibling;
                
                if (input.type === 'password') {
                    input.type = 'text';
                    button.textContent = '👁️';
                } else {
                    input.type = 'password';
                    button.textContent = '👁️‍🗨️';
                }
            }
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        console.log('🔐 Procesando inicio de sesión...');

        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';

        // Validación
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Iniciando sesión...');

        try {
            const response = await this.makeLoginRequest(email, password, rememberMe);
            
            if (response.success) {
                await this.handleLoginSuccess(response.user, response.token);
            } else {
                this.handleLoginError(response.message);
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            this.handleLoginError('Error de conexión. Por favor, intenta nuevamente.');
        } finally {
            this.hideLoading(submitBtn);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        console.log('📝 Procesando registro...');

        const form = event.target;
        const formData = new FormData(form);
        const nombre = formData.get('nombre').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const terms = formData.get('terms') === 'on';

        // Validación
        if (!this.validateRegisterForm(nombre, email, password, confirmPassword, terms)) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Creando cuenta...');

        try {
            const response = await this.makeRegisterRequest(nombre, email, password);
            
            if (response.success) {
                await this.handleRegisterSuccess(response.user, response.token);
            } else {
                this.handleRegisterError(response.message);
            }
        } catch (error) {
            console.error('❌ Error en registro:', error);
            this.handleRegisterError('Error de conexión. Por favor, intenta nuevamente.');
        } finally {
            this.hideLoading(submitBtn);
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;

        if (!this.validateEmailField(email)) {
            isValid = false;
        }

        if (!this.validatePasswordField(password)) {
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(nombre, email, password, confirmPassword, terms) {
        let isValid = true;

        if (!nombre || nombre.trim().length < 2) {
            this.showFieldError('register', 'nombre', 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        }

        if (!this.validateEmailField(email)) {
            isValid = false;
        }

        if (!this.validatePasswordField(password)) {
            isValid = false;
        }

        if (password !== confirmPassword) {
            this.showFieldError('register', 'confirmPassword', 'Las contraseñas no coinciden');
            isValid = false;
        }

        if (!terms) {
            this.showFieldError('register', 'terms', 'Debes aceptar los términos y condiciones');
            isValid = false;
        }

        return isValid;
    }

    validateEmailField(email) {
        if (!email) {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return false;
        }

        return true;
    }

    validatePasswordField(password) {
        if (!password) {
            return false;
        }

        if (password.length < 6) {
            return false;
        }

        return true;
    }

    validateEmail(input) {
        const isValid = this.validateEmailField(input.value);
        if (!isValid) {
            this.showFieldErrorByInput(input, 'Por favor ingresa un email válido');
        } else {
            this.clearFieldError(input);
        }
        return isValid;
    }

    validatePassword(input) {
        const isValid = this.validatePasswordField(input.value);
        if (!isValid) {
            this.showFieldErrorByInput(input, 'La contraseña debe tener al menos 6 caracteres');
        } else {
            this.clearFieldError(input);
        }
        return isValid;
    }

    updatePasswordStrength(password) {
        const strengthMeter = document.querySelector('.password-strength-meter');
        const strengthText = document.querySelector('.password-strength-text');
        
        if (!strengthMeter || !strengthText) return;

        let strength = 0;
        let text = '';
        let className = '';

        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                text = 'Débil';
                className = 'strength-weak';
                break;
            case 2:
                text = 'Regular';
                className = 'strength-fair';
                break;
            case 3:
                text = 'Buena';
                className = 'strength-good';
                break;
            case 4:
                text = 'Fuerte';
                className = 'strength-strong';
                break;
        }

        strengthMeter.className = `password-strength-meter ${className}`;
        strengthText.className = `password-strength-text strength-text-${className.split('-')[1]}`;
        strengthText.textContent = text;
    }

    async handleLoginSuccess(user, token) {
        console.log('✅ Login exitoso:', user);
        
        // Actualizar estado
        this.state.isAuthenticated = true;
        this.state.currentUser = user;
        this.state.token = token;

        // Guardar en almacenamiento
        this.saveAuthData(user, token);

        // Mostrar mensaje de éxito
        this.showAuthMessage('login', `¡Bienvenido ${user.nombre}!`, 'success');

        // Actualizar UI
        this.updateUIAuthState();

        // Cerrar popup y resetear formulario
        setTimeout(() => {
            this.closePopup('popup-login');
            this.resetForm('loginForm');
        }, 1500);
    }

    handleLoginError(message) {
        console.error('❌ Error en login:', message);
        this.showAuthMessage('login', message, 'error');
    }

    async handleRegisterSuccess(user, token) {
        console.log('✅ Registro exitoso:', user);
        
        // Mostrar mensaje de éxito
        this.showAuthMessage('register', '¡Cuenta creada exitosamente!', 'success');

        // Cerrar popup y redirigir al login
        setTimeout(() => {
            this.closePopup('popup-registro');
            this.resetForm('registerForm');
            this.showLogin();
            this.showAuthMessage('login', '¡Cuenta creada! Ahora puedes iniciar sesión.', 'success');
        }, 2000);
    }

    handleRegisterError(message) {
        console.error('❌ Error en registro:', message);
        this.showAuthMessage('register', message, 'error');
    }

    showAuthMessage(formType, message, type) {
        const form = document.getElementById(`${formType}Form`);
        if (!form) return;

        // Remover mensajes existentes
        const existingMessages = form.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());

        // Crear nuevo mensaje
        const messageElement = document.createElement('div');
        messageElement.className = `auth-message ${type}`;
        messageElement.innerHTML = `
            <div class="message-icon">${this.getMessageIcon(type)}</div>
            <div class="message-text">${message}</div>
        `;

        // Insertar mensaje
        form.insertBefore(messageElement, form.firstChild);

        // Auto-remover
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }

    getMessageIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    showFieldError(formType, fieldName, message) {
        const form = document.getElementById(`${formType}Form`);
        const field = form.querySelector(`[name="${fieldName}"]`);
        
        if (field) {
            this.showFieldErrorByInput(field, message);
        }
    }

    showFieldErrorByInput(input, message) {
        input.classList.add('error');
        
        let errorElement = input.parentElement.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    showLoading(button, text = 'Procesando...') {
        button.disabled = true;
        button.classList.add('loading');
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = `
            <span class="loading-spinner"></span>
            ${text}
        `;
    }

    hideLoading(button) {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = button.getAttribute('data-original-text') || 'Enviar';
    }

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Limpiar errores
            const errors = form.querySelectorAll('.error-message');
            errors.forEach(error => error.classList.remove('show'));
            
            const errorInputs = form.querySelectorAll('.error');
            errorInputs.forEach(input => input.classList.remove('error'));
            
            // Limpiar mensajes
            const messages = form.querySelectorAll('.auth-message');
            messages.forEach(message => message.remove());
            
            // Resetear indicador de fortaleza de contraseña
            const strengthMeter = form.querySelector('.password-strength-meter');
            const strengthText = form.querySelector('.password-strength-text');
            if (strengthMeter && strengthText) {
                strengthMeter.className = 'password-strength-meter';
                strengthText.textContent = '';
            }
        }
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('stepup_currentUser');
        const savedToken = localStorage.getItem('stepup_authToken');
        
        if (savedUser && savedToken) {
            try {
                this.state.currentUser = JSON.parse(savedUser);
                this.state.token = savedToken;
                this.state.isAuthenticated = true;
                this.updateUIAuthState();
                console.log('✅ Sesión recuperada:', this.state.currentUser.nombre);
            } catch (error) {
                console.error('❌ Error recuperando sesión:', error);
                this.logout();
            }
        }
    }

    saveAuthData(user, token) {
        try {
            localStorage.setItem('stepup_currentUser', JSON.stringify(user));
            localStorage.setItem('stepup_authToken', token);
            localStorage.setItem('stepup_lastLogin', new Date().toISOString());
        } catch (error) {
            console.error('❌ Error guardando datos de autenticación:', error);
        }
    }

    updateUIAuthState() {
        // Actualizar navegación principal
        this.updateMainNavigation();
        
        // Actualizar menú móvil
        this.updateMobileMenu();
        
        // Actualizar elementos específicos de la página
        this.updatePageSpecificElements();
    }

    updateMainNavigation() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;

        if (this.state.isAuthenticated && this.state.currentUser) {
            userActions.innerHTML = `
                <div class="user-menu">
                    <div class="user-greeting">
                        <span class="user-avatar">👤</span>
                        <span class="user-name">Hola, ${this.state.currentUser.nombre.split(' ')[0]}</span>
                    </div>
                    <div class="user-dropdown">
                        <a href="/cuenta" class="dropdown-item">
                            <span class="dropdown-icon">📊</span>
                            Mi Cuenta
                        </a>
                        <a href="/pedidos" class="dropdown-item">
                            <span class="dropdown-icon">📦</span>
                            Mis Pedidos
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item dropdown-item-logout" onclick="authSystem.logout()">
                            <span class="dropdown-icon">🚪</span>
                            Cerrar Sesión
                        </a>
                    </div>
                </div>
                <a href="#" onclick="mostrarCarrito()" class="btn btn-primary btn-cart">
                    <span class="cart-icon">🛒</span>
                    Carrito (<span id="carrito-count">0</span>)
                </a>
            `;
        } else {
            userActions.innerHTML = `
                <a href="#" onclick="authSystem.showLogin()" class="btn btn-outline btn-login">
                    <span class="btn-icon">🔐</span>
                    Iniciar Sesión
                </a>
                <a href="#" onclick="mostrarCarrito()" class="btn btn-primary btn-cart">
                    <span class="cart-icon">🛒</span>
                    Carrito (<span id="carrito-count">0</span>)
                </a>
            `;
        }
    }

    updateMobileMenu() {
        const authLinks = document.getElementById('mobileAuthLinks');
        const userMenu = document.getElementById('mobileUserMenu');
        
        if (authLinks && userMenu) {
            if (this.state.isAuthenticated) {
                authLinks.style.display = 'none';
                userMenu.style.display = 'flex';
                
                // Actualizar nombre de usuario en menú móvil
                const userNameElements = userMenu.querySelectorAll('.user-name');
                userNameElements.forEach(element => {
                    element.textContent = this.state.currentUser.nombre.split(' ')[0];
                });
            } else {
                authLinks.style.display = 'flex';
                userMenu.style.display = 'none';
            }
        }
    }

    updatePageSpecificElements() {
        // Actualizar elementos específicos según la página
        const protectedElements = document.querySelectorAll('[data-auth-required]');
        protectedElements.forEach(element => {
            if (this.state.isAuthenticated) {
                element.style.display = element.dataset.authDisplay || 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    logout() {
        console.log('🚪 Cerrando sesión...');
        
        // Limpiar estado
        this.state.isAuthenticated = false;
        this.state.currentUser = null;
        this.state.token = null;
        
        // Limpiar almacenamiento
        localStorage.removeItem('stepup_currentUser');
        localStorage.removeItem('stepup_authToken');
        localStorage.removeItem('stepup_lastLogin');
        
        // Actualizar UI
        this.updateUIAuthState();
        
        // Mostrar mensaje
        this.showToast('Sesión cerrada correctamente', 'success');
        
        // Redirigir si es necesario
        if (window.location.pathname.includes('/cuenta') || 
            window.location.pathname.includes('/pedidos')) {
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }

    showLogin() {
        this.showPopup('popup-login');
        this.resetForm('loginForm');
    }

    showRegister() {
        this.showPopup('popup-registro');
        this.resetForm('registerForm');
    }

    showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    closeAllPopups() {
        this.closePopup('popup-login');
        this.closePopup('popup-registro');
    }

    showToast(message, type = 'info') {
        // Implementación de toast notifications
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${this.getMessageIcon(type)}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Métodos de API (simulados - reemplazar con implementación real)
    async makeLoginRequest(email, password, rememberMe) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulación de validación
                const testUsers = {
                    'usuario@stepup.com': { password: 'password123', user: { id: 1, nombre: 'Usuario StepUp', email: email } },
                    'admin@stepup.com': { password: 'admin123', user: { id: 2, nombre: 'Administrador', email: email, role: 'admin' } }
                };
                
                const userData = testUsers[email];
                
                if (userData && userData.password === password) {
                    resolve({
                        success: true,
                        user: userData.user,
                        token: 'stepup_token_' + Date.now()
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Email o contraseña incorrectos'
                    });
                }
            }, 1500);
        });
    }

    async makeRegisterRequest(nombre, email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulación de registro
                resolve({
                    success: true,
                    user: {
                        id: Date.now(),
                        nombre: nombre,
                        email: email,
                        role: 'user',
                        fechaRegistro: new Date().toISOString()
                    },
                    token: 'stepup_token_' + Date.now()
                });
            }, 1500);
        });
    }

    // Getters para estado de autenticación
    isAuthenticated() {
        return this.state.isAuthenticated;
    }

    getCurrentUser() {
        return this.state.currentUser;
    }

    getToken() {
        return this.state.token;
    }
}

// Instancia global del sistema de autenticación
const authSystem = new AuthSystem();

// Funciones globales para compatibilidad
function mostrarLogin() {
    authSystem.showLogin();
}

function mostrarRegistro() {
    authSystem.showRegister();
}

function logout() {
    authSystem.logout();
}

function cambiarFormulario(tipo) {
    if (tipo === 'login') {
        authSystem.closePopup('popup-registro');
        authSystem.showLogin();
    } else {
        authSystem.closePopup('popup-login');
        authSystem.showRegister();
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authSystem;
}