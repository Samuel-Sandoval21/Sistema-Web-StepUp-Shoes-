// static/js/main.js - Sistema principal StepUp Shoes

/**
 * Sistema principal de la aplicación
 * Coordina todos los módulos y proporciona funcionalidades globales
 */

class StepUpApp {
    constructor() {
        this.modules = {
            auth: null,
            carrito: null,
            checkout: null
        };
        
        this.config = {
            debug: true,
            version: '2.0.0',
            apiBaseUrl: '/api/v1'
        };
        
        this.init();
    }

    init() {
        console.log(`🚀 Iniciando StepUp Shoes v${this.config.version}...`);
        
        this.setupGlobalHandlers();
        this.initializeModules();
        this.setupServiceWorker();
        this.setupAnalytics();
        this.setupErrorHandling();
        
        console.log('✅ Aplicación StepUp Shoes inicializada correctamente');
    }

    setupGlobalHandlers() {
        // Manejo de popups
        this.setupPopupHandlers();
        
        // Navegación
        this.setupNavigation();
        
        // Formularios globales
        this.setupGlobalForms();
        
        // Utilidades de UI
        this.setupUIUtilities();
    }

    setupPopupHandlers() {
        // Cerrar popups al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup')) {
                this.closePopup(e.target.id);
            }
        });

        // Cerrar popups con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllPopups();
            }
        });

        // Cerrar popups con botones de cerrar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-close') || 
                e.target.classList.contains('auth-close') ||
                e.target.classList.contains('carrito-close')) {
                const popup = e.target.closest('.popup');
                if (popup) {
                    this.closePopup(popup.id);
                }
            }
        });
    }

    setupNavigation() {
        // Navegación suave para anchors
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToElement(targetId);
            }
        });

        // Navegación activa
        this.updateActiveNavigation();
    }

    setupGlobalForms() {
        // Prevenir envío de formularios no válidos
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.classList.contains('needs-validation')) {
                if (!form.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                form.classList.add('was-validated');
            }
        });

        // Mejorar UX de formularios
        this.enhanceFormUX();
    }

    setupUIUtilities() {
        // Lazy loading para imágenes
        this.setupLazyLoading();
        
        // Animaciones de entrada
        this.setupScrollAnimations();
        
        // Tooltips
        this.setupTooltips();
        
        // Contadores y animaciones
        this.setupCounters();
    }

    initializeModules() {
        // Inicializar sistema de autenticación
        if (typeof AuthSystem !== 'undefined') {
            this.modules.auth = new AuthSystem();
        } else if (typeof authSystem !== 'undefined') {
            this.modules.auth = authSystem;
        }

        // Inicializar sistema del carrito
        if (typeof CarritoSystem !== 'undefined') {
            this.modules.carrito = new CarritoSystem();
        } else if (typeof carritoSystem !== 'undefined') {
            this.modules.carrito = carritoSystem;
        }

        // El checkout se inicializa automáticamente en su página
        if (typeof CheckoutSystem !== 'undefined' && document.getElementById('checkout-container')) {
            this.modules.checkout = new CheckoutSystem();
        }

        console.log('📦 Módulos inicializados:', Object.keys(this.modules));
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('✅ ServiceWorker registrado:', registration);
                    })
                    .catch((error) => {
                        console.log('❌ Error registrando ServiceWorker:', error);
                    });
            });
        }
    }

    setupAnalytics() {
        // Configurar analytics básico
        this.trackPageView();
        this.setupEventTracking();
    }

    setupErrorHandling() {
        // Manejo global de errores
        window.addEventListener('error', (e) => {
            this.handleError('Global Error', e.error);
        });

        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError('Unhandled Promise Rejection', e.reason);
        });

        // Error boundaries para componentes
        this.setupErrorBoundaries();
    }

    // Métodos de popup
    mostrarPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Animar entrada
            setTimeout(() => {
                popup.classList.add('active');
            }, 10);
        }
    }

    closePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.classList.remove('active');
            setTimeout(() => {
                popup.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    closeAllPopups() {
        const popups = document.querySelectorAll('.popup');
        popups.forEach(popup => {
            this.closePopup(popup.id);
        });
    }

    // Navegación
    scrollToElement(elementId, offset = 80) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu-links a');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath || 
                (currentPath.includes(linkPath) && linkPath !== '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    navegarA(url) {
        window.location.href = url;
    }

    // Formularios
    enhanceFormUX() {
        // Mejorar selects
        this.enhanceSelects();
        
        // Mejorar inputs numéricos
        this.enhanceNumberInputs();
        
        // Validación en tiempo real
        this.setupRealTimeValidation();
    }

    enhanceSelects() {
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('focus', () => {
                select.parentElement.classList.add('focused');
            });
            
            select.addEventListener('blur', () => {
                select.parentElement.classList.remove('focused');
            });
        });
    }

    enhanceNumberInputs() {
        document.querySelectorAll('input[type="number"]').forEach(input => {
            // Prevenir valores negativos
            input.addEventListener('input', (e) => {
                if (e.target.value < 0) {
                    e.target.value = 0;
                }
            });
        });
    }

    setupRealTimeValidation() {
        document.querySelectorAll('[data-validate]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const validator = field.dataset.validate;
        
        let isValid = true;
        let message = '';
        
        switch (validator) {
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                message = 'Por favor ingresa un email válido';
                break;
            case 'required':
                isValid = value.length > 0;
                message = 'Este campo es requerido';
                break;
            case 'phone':
                isValid = /^[\+]?[0-9\s\-\(\)]{8,}$/.test(value.replace(/\s/g, ''));
                message = 'Por favor ingresa un teléfono válido';
                break;
        }
        
        this.setFieldValidation(field, isValid, message);
        return isValid;
    }

    setFieldValidation(field, isValid, message) {
        field.classList.remove('is-valid', 'is-invalid');
        
        if (isValid) {
            field.classList.add('is-valid');
        } else {
            field.classList.add('is-invalid');
        }
        
        // Mostrar/ocultar mensaje de error
        let errorElement = field.parentElement.querySelector('.invalid-feedback');
        if (!errorElement && !isValid) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentElement.appendChild(errorElement);
        }
        
        if (errorElement) {
            errorElement.textContent = isValid ? '' : message;
        }
    }

    // Utilidades de UI
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    setupScrollAnimations() {
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1
            });

            document.querySelectorAll('[data-animate]').forEach(element => {
                animationObserver.observe(element);
            });
        }
    }

    setupTooltips() {
        document.addEventListener('mouseover', (e) => {
            const element = e.target;
            const tooltip = element.getAttribute('data-tooltip');
            
            if (tooltip) {
                this.showTooltip(element, tooltip);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const element = e.target;
            if (element.getAttribute('data-tooltip')) {
                this.hideTooltip();
            }
        });
    }

    showTooltip(element, text) {
        let tooltip = document.getElementById('global-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'global-tooltip';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.textContent = text;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
        tooltip.classList.add('show');
    }

    hideTooltip() {
        const tooltip = document.getElementById('global-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }

    setupCounters() {
        document.querySelectorAll('[data-counter]').forEach(element => {
            const target = parseInt(element.dataset.counter);
            const duration = parseInt(element.dataset.duration) || 2000;
            const increment = target / (duration / 16); // 60fps
            
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current).toLocaleString();
            }, 16);
        });
    }

    // Analytics
    trackPageView() {
        if (this.config.debug) {
            console.log('📊 Pageview:', window.location.pathname);
        }
        
        // Integrar con Google Analytics u otro servicio
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
    }

    setupEventTracking() {
        // Trackear eventos importantes
        document.addEventListener('click', (e) => {
            const element = e.target;
            const eventCategory = element.dataset.eventCategory;
            const eventAction = element.dataset.eventAction;
            const eventLabel = element.dataset.eventLabel;
            
            if (eventCategory && eventAction) {
                this.trackEvent(eventCategory, eventAction, eventLabel);
            }
        });
    }

    trackEvent(category, action, label = '') {
        if (this.config.debug) {
            console.log('📊 Event:', { category, action, label });
        }
        
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
    }

    // Manejo de errores
    handleError(type, error) {
        console.error(`❌ ${type}:`, error);
        
        // En producción, enviar errores a un servicio de monitoreo
        if (!this.config.debug) {
            this.reportError(type, error);
        }
        
        // Mostrar error amigable al usuario si es crítico
        if (this.isCriticalError(error)) {
            this.showErrorModal('Ha ocurrido un error inesperado. Por favor, recarga la página.');
        }
    }

    isCriticalError(error) {
        // Determinar si el error es crítico
        const criticalPatterns = [
            /network/i,
            /timeout/i,
            /failed to fetch/i
        ];
        
        return criticalPatterns.some(pattern => pattern.test(error.message));
    }

    showErrorModal(message) {
        const modal = document.createElement('div');
        modal.className = 'error-modal';
        modal.innerHTML = `
            <div class="error-modal-content">
                <div class="error-icon">⚠️</div>
                <h3>Algo salió mal</h3>
                <p>${message}</p>
                <button onclick="this.closest('.error-modal').remove()" class="btn btn-primary">
                    Entendido
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    setupErrorBoundaries() {
        // Error boundary para componentes específicos
        this.wrapComponent = (component, fallback) => {
            return (...args) => {
                try {
                    return component(...args);
                } catch (error) {
                    this.handleError('Component Error', error);
                    return fallback ? fallback(...args) : null;
                }
            };
        };
    }

    reportError(type, error) {
        // Enviar error a servicio de monitoreo
        fetch('/api/error-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                message: error.message,
                stack: error.stack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(() => {
            // Silenciar errores en el reporte de errores
        });
    }

    // Utilidades de rendimiento
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // API helpers
    async apiCall(endpoint, options = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            this.handleError('API Call Failed', error);
            throw error;
        }
    }

    // Estado de la aplicación
    getAppState() {
        return {
            version: this.config.version,
            modules: Object.keys(this.modules),
            user: this.modules.auth ? this.modules.auth.getCurrentUser() : null,
            cartItems: this.modules.carrito ? this.modules.carrito.getItems().length : 0,
            currentPath: window.location.pathname
        };
    }

    // Debug utilities
    debug(...args) {
        if (this.config.debug) {
            console.log('🐛 DEBUG:', ...args);
        }
    }
}

// Funciones globales para compatibilidad
function mostrarLogin() {
    if (window.stepUpApp && window.stepUpApp.modules.auth) {
        window.stepUpApp.modules.auth.showLogin();
    }
}

function mostrarRegistro() {
    if (window.stepUpApp && window.stepUpApp.modules.auth) {
        window.stepUpApp.modules.auth.showRegister();
    }
}

function mostrarCarrito() {
    if (window.stepUpApp && window.stepUpApp.modules.carrito) {
        window.stepUpApp.modules.carrito.mostrarCarrito();
    }
}

function cerrarPopUp(popupId) {
    if (window.stepUpApp) {
        window.stepUpApp.closePopup(popupId);
    } else {
        document.getElementById(popupId).style.display = 'none';
    }
}

function cambiarFormulario(tipo) {
    if (tipo === 'login') {
        cerrarPopUp('popup-registro');
        mostrarLogin();
    } else {
        cerrarPopUp('popup-login');
        mostrarRegistro();
    }
}

function logout() {
    if (window.stepUpApp && window.stepUpApp.modules.auth) {
        window.stepUpApp.modules.auth.logout();
    }
}

function agregarAlCarrito(productoId, talla = null, cantidad = 1) {
    if (window.stepUpApp && window.stepUpApp.modules.carrito) {
        return window.stepUpApp.modules.carrito.agregarProducto(productoId, talla, cantidad);
    }
    return false;
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.stepUpApp = new StepUpApp();
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
});

// Función global para actualizar contador del carrito
function actualizarContadorCarrito() {
    if (window.stepUpApp && window.stepUpApp.modules.carrito) {
        window.stepUpApp.modules.carrito.actualizarContadorHeader();
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StepUpApp;
}