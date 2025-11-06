/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
// static/js/auth.js - Manejo de autenticación

/**
 * Funciones para manejar login, registro y autenticación
 */

// Estado de autenticación
let authState = {
    isAuthenticated: false,
    currentUser: null
};

// Elementos del DOM
const authElements = {
    loginForm: null,
    registerForm: null,
    loginPopup: null,
    registerPopup: null
};

// Inicializar sistema de autenticación
function initAuth() {
    console.log('Inicializando sistema de autenticación...');
    
    // Obtener elementos del DOM
    authElements.loginForm = document.getElementById('loginForm');
    authElements.registerForm = document.getElementById('registerForm');
    authElements.loginPopup = document.getElementById('popup-login');
    authElements.registerPopup = document.getElementById('popup-registro');
    
    // Verificar si hay usuario logueado
    checkAuthStatus();
    
    // Configurar event listeners
    setupAuthEventListeners();
}

// Configurar event listeners para formularios
function setupAuthEventListeners() {
    // Formulario de login
    if (authElements.loginForm) {
        authElements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulario de registro
    if (authElements.registerForm) {
        authElements.registerForm.addEventListener('submit', handleRegister);
    }
    
    // Validación en tiempo real
    setupRealTimeValidation();
}

// Validación en tiempo real
function setupRealTimeValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    emailInputs.forEach(input => {
        input.addEventListener('blur', validateEmail);
    });
    
    passwordInputs.forEach(input => {
        input.addEventListener('blur', validatePassword);
    });
}

// Validar email
function validateEmail(event) {
    const email = event.target.value;
    const errorElement = event.target.parentElement.querySelector('.error-message');
    
    if (!email) {
        showError(errorElement, 'El email es requerido');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(errorElement, 'Por favor ingresa un email válido');
        return false;
    }
    
    hideError(errorElement);
    return true;
}

// Validar contraseña
function validatePassword(event) {
    const password = event.target.value;
    const errorElement = event.target.parentElement.querySelector('.error-message');
    
    if (!password) {
        showError(errorElement, 'La contraseña es requerida');
        return false;
    }
    
    if (password.length < 6) {
        showError(errorElement, 'La contraseña debe tener al menos 6 caracteres');
        return false;
    }
    
    hideError(errorElement);
    return true;
}

// Manejar login
async function handleLogin(event) {
    event.preventDefault();
    console.log('Procesando login...');
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validar campos
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Simular petición al backend (reemplazar con fetch real)
        const response = await simulateLoginRequest(email, password, rememberMe);
        
        if (response.success) {
            // Login exitoso
            handleLoginSuccess(response.user);
        } else {
            // Error en login
            handleLoginError(response.message);
        }
    } catch (error) {
        console.error('Error en login:', error);
        handleLoginError('Error de conexión. Intenta nuevamente.');
    } finally {
        hideLoading(submitBtn);
    }
}

// Validar formulario de login
function validateLoginForm(email, password) {
    let isValid = true;
    
    if (!email) {
        showFormError('login', 'email', 'El email es requerido');
        isValid = false;
    }
    
    if (!password) {
        showFormError('login', 'password', 'La contraseña es requerida');
        isValid = false;
    }
    
    return isValid;
}

// Manejar registro
async function handleRegister(event) {
    event.preventDefault();
    console.log('Procesando registro...');
    
    const form = event.target;
    const formData = new FormData(form);
    const nombre = formData.get('nombre');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms') === 'on';
    
    // Validar campos
    if (!validateRegisterForm(nombre, email, password, confirmPassword, terms)) {
        return;
    }
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Simular petición al backend (reemplazar con fetch real)
        const response = await simulateRegisterRequest(nombre, email, password);
        
        if (response.success) {
            // Registro exitoso
            handleRegisterSuccess(response.user);
        } else {
            // Error en registro
            handleRegisterError(response.message);
        }
    } catch (error) {
        console.error('Error en registro:', error);
        handleRegisterError('Error de conexión. Intenta nuevamente.');
    } finally {
        hideLoading(submitBtn);
    }
}

// Validar formulario de registro
function validateRegisterForm(nombre, email, password, confirmPassword, terms) {
    let isValid = true;
    
    if (!nombre || nombre.trim().length < 2) {
        showFormError('register', 'nombre', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }
    
    if (!email) {
        showFormError('register', 'email', 'El email es requerido');
        isValid = false;
    }
    
    if (!password) {
        showFormError('register', 'password', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showFormError('register', 'password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showFormError('register', 'confirmPassword', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    if (!terms) {
        showFormError('register', 'terms', 'Debes aceptar los términos y condiciones');
        isValid = false;
    }
    
    return isValid;
}

// Manejar éxito de login
function handleLoginSuccess(user) {
    console.log('Login exitoso:', user);
    
    // Actualizar estado
    authState.isAuthenticated = true;
    authState.currentUser = user;
    
    // Guardar en localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', user.token); // En un caso real
    
    // Mostrar mensaje de éxito
    showAuthMessage('login', `¡Bienvenido ${user.nombre}!`, 'success');
    
    // Actualizar UI
    updateUIAuthState();
    
    // Cerrar popup después de un tiempo
    setTimeout(() => {
        cerrarPopUp('popup-login');
        resetForm('loginForm');
    }, 1500);
}

// Manejar error de login
function handleLoginError(message) {
    console.error('Error en login:', message);
    showAuthMessage('login', message, 'error');
}

// Manejar éxito de registro
function handleRegisterSuccess(user) {
    console.log('Registro exitoso:', user);
    
    // Mostrar mensaje de éxito
    showAuthMessage('register', '¡Registro exitoso! Redirigiendo...', 'success');
    
    // Cerrar popup y abrir login después de un tiempo
    setTimeout(() => {
        cerrarPopUp('popup-registro');
        resetForm('registerForm');
        mostrarLogin();
        showAuthMessage('login', '¡Cuenta creada! Ahora puedes iniciar sesión.', 'success');
    }, 2000);
}

// Manejar error de registro
function handleRegisterError(message) {
    console.error('Error en registro:', message);
    showAuthMessage('register', message, 'error');
}

// Mostrar mensaje de autenticación
function showAuthMessage(formType, message, type) {
    const form = document.getElementById(`${formType}Form`);
    if (!form) return;
    
    // Remover mensajes anteriores
    const existingMessage = form.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Crear nuevo mensaje
    const messageElement = document.createElement('div');
    messageElement.className = `auth-message ${type}`;
    messageElement.textContent = message;
    
    // Insertar al inicio del formulario
    form.insertBefore(messageElement, form.firstChild);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}

// Mostrar error en campo específico
function showFormError(formType, fieldName, message) {
    const form = document.getElementById(`${formType}Form`);
    const field = form.querySelector(`[name="${fieldName}"]`);
    
    if (!field) return;
    
    field.classList.add('error');
    
    let errorElement = field.parentElement.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Mostrar error genérico
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

// Ocultar error
function hideError(element) {
    if (element) {
        element.classList.remove('show');
    }
}

// Mostrar loading en botón
function showLoading(button) {
    button.disabled = true;
    button.classList.add('loading');
    button.setAttribute('data-original-text', button.textContent);
    button.textContent = 'Procesando...';
}

// Ocultar loading
function hideLoading(button) {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = button.getAttribute('data-original-text') || 'Enviar';
}

// Resetear formulario
function resetForm(formId) {
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
    }
}

// Verificar estado de autenticación
function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
        try {
            authState.currentUser = JSON.parse(savedUser);
            authState.isAuthenticated = true;
            updateUIAuthState();
        } catch (error) {
            console.error('Error parsing saved user:', error);
            logout();
        }
    }
}

// Actualizar UI según estado de autenticación
function updateUIAuthState() {
    const userActions = document.querySelector('.user-actions');
    
    if (!userActions) return;
    
    if (authState.isAuthenticated && authState.currentUser) {
        userActions.innerHTML = `
            <div class="user-menu">
                <span>Hola, ${authState.currentUser.nombre}</span>
                <div class="user-dropdown">
                    <a href="/cuenta">Mi Cuenta</a>
                    <a href="/pedidos">Mis Pedidos</a>
                    <a href="#" onclick="logout()">Cerrar Sesión</a>
                </div>
            </div>
            <a href="#" onclick="mostrarCarrito()" class="btn btn-primary">Carrito (<span id="carrito-count">0</span>)</a>
        `;
    } else {
        userActions.innerHTML = `
            <a href="#" onclick="mostrarLogin()" class="btn btn-outline">Iniciar Sesión</a>
            <a href="#" onclick="mostrarCarrito()" class="btn btn-primary">Carrito (<span id="carrito-count">0</span>)</a>
        `;
    }
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
}

// Cerrar sesión
function logout() {
    console.log('Cerrando sesión...');
    
    // Limpiar estado
    authState.isAuthenticated = false;
    authState.currentUser = null;
    
    // Limpiar localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    
    // Actualizar UI
    updateUIAuthState();
    
    // Mostrar mensaje
    alert('Sesión cerrada correctamente');
}

// Simular petición de login (REEMPLAZAR CON FETCH REAL)
async function simulateLoginRequest(email, password, rememberMe) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simular validación
            if (email === 'usuario@ejemplo.com' && password === 'password123') {
                resolve({
                    success: true,
                    user: {
                        id: 1,
                        nombre: 'Usuario Ejemplo',
                        email: email,
                        token: 'simulated-token-123'
                    }
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

// Simular petición de registro (REEMPLAZAR CON FETCH REAL)
async function simulateRegisterRequest(nombre, email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simular registro exitoso
            resolve({
                success: true,
                user: {
                    id: Date.now(),
                    nombre: nombre,
                    email: email,
                    token: 'simulated-token-' + Date.now()
                }
            });
        }, 1500);
    });
}

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

