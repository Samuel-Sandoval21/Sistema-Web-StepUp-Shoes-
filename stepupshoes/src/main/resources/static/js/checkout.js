/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
// static/js/checkout.js - Proceso completo de checkout

/**
 * Sistema de checkout para StepUp Shoes
 * Maneja información de envío, métodos de pago y confirmación de pedido
 */

// Estado del checkout

let checkoutState = {
    pasoActual: 1,
    totalPasos: 3,
    informacionEnvio: {
        nombreCompleto: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        pais: 'Costa Rica'
    },
    metodoEnvio: {
        id: 'estandar',
        nombre: 'Envío Estándar',
        precio: 10,
        tiempo: '3-5 días hábiles',
        selected: true
    },
    metodoPago: {
        tipo: '',
        detalles: {}
    },
    resumenPedido: {}
};

// Métodos de envío disponibles
const metodosEnvio = [
    {
        id: 'estandar',
        nombre: 'Envío Estándar',
        precio: 10,
        tiempo: '3-5 días hábiles',
        descripcion: 'Entrega a domicilio estándar'
    },
    {
        id: 'express',
        nombre: 'Envío Express',
        precio: 20,
        tiempo: '1-2 días hábiles',
        descripcion: 'Entrega prioritaria'
    },
    {
        id: 'gratis',
        nombre: 'Envío Gratis',
        precio: 0,
        tiempo: '5-7 días hábiles',
        descripcion: 'Envío gratis en compras mayores a $100',
        minCompra: 100
    }
];

// Métodos de pago disponibles
const metodosPago = [
    {
        id: 'tarjeta',
        nombre: 'Tarjeta de Crédito/Débito',
        icono: '💳',
        descripcion: 'Pago seguro con tarjeta'
    },
    {
        id: 'paypal',
        nombre: 'PayPal',
        icono: '🔵',
        descripcion: 'Pago rápido y seguro con PayPal'
    },
    {
        id: 'transferencia',
        nombre: 'Transferencia Bancaria',
        icono: '🏦',
        descripcion: 'Transferencia bancaria directa'
    }
];

// Inicializar checkout
function initCheckout() {
    console.log('Inicializando proceso de checkout...');
    
    // Cargar datos del carrito
    cargarDatosCarrito();
    
    // Cargar información guardada
    cargarCheckoutDesdeStorage();
    
    // Configurar event listeners
    setupCheckoutEventListeners();
    
    // Renderizar paso inicial
    renderizarPasoActual();
    
    // Actualizar resumen
    actualizarResumenPedido();
}

// Cargar datos del carrito
function cargarDatosCarrito() {
    const resumenCarrito = obtenerResumenCarrito();
    checkoutState.resumenPedido = resumenCarrito;
    
    // Actualizar método de envío gratis si aplica
    if (resumenCarrito.subtotal >= 100) {
        const envioGratis = metodosEnvio.find(m => m.id === 'gratis');
        if (envioGratis) {
            checkoutState.metodoEnvio = { ...envioGratis, selected: true };
        }
    }
}

// Configurar event listeners del checkout
function setupCheckoutEventListeners() {
    // Formulario de envío
    const formularioEnvio = document.getElementById('formulario-envio');
    if (formularioEnvio) {
        formularioEnvio.addEventListener('input', function(event) {
            actualizarInformacionEnvio(event.target.name, event.target.value);
        });
    }
    
    // Validación en tiempo real
    setupValidacionCheckout();
    
    // Métodos de envío
    document.addEventListener('click', function(event) {
        if (event.target.closest('.shipping-method')) {
            const methodId = event.target.closest('.shipping-method').dataset.methodId;
            seleccionarMetodoEnvio(methodId);
        }
        
        if (event.target.closest('.payment-method')) {
            const methodId = event.target.closest('.payment-method').dataset.methodId;
            seleccionarMetodoPago(methodId);
        }
    });
    
    // Navegación entre pasos
    document.addEventListener('click', function(event) {
        if (event.target.id === 'btn-continuar-paso-1') {
            if (validarPasoEnvio()) {
                avanzarPaso(2);
            }
        }
        
        if (event.target.id === 'btn-continuar-paso-2') {
            if (validarPasoPago()) {
                avanzarPaso(3);
            }
        }
        
        if (event.target.id === 'btn-volver-paso-2') {
            retrocederPaso(1);
        }
        
        if (event.target.id === 'btn-volver-paso-3') {
            retrocederPaso(2);
        }
        
        if (event.target.id === 'btn-finalizar-pedido') {
            finalizarPedido();
        }
    });
}

// Configurar validación en tiempo real
function setupValidacionCheckout() {
    const inputs = document.querySelectorAll('#formulario-envio input, #formulario-envio select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validarCampo(this.name, this.value);
        });
        
        input.addEventListener('input', function() {
            limpiarError(this.name);
        });
    });
}

// Validar campo individual
function validarCampo(nombre, valor) {
    switch (nombre) {
        case 'nombreCompleto':
            return validarNombreCompleto(valor);
        case 'email':
            return validarEmail(valor);
        case 'telefono':
            return validarTelefono(valor);
        case 'direccion':
            return validarDireccion(valor);
        case 'ciudad':
            return validarCiudad(valor);
        case 'estado':
            return validarEstado(valor);
        case 'codigoPostal':
            return validarCodigoPostal(valor);
        default:
            return true;
    }
}

// Funciones de validación específicas
function validarNombreCompleto(valor) {
    if (!valor || valor.trim().length < 2) {
        mostrarError('nombreCompleto', 'El nombre debe tener al menos 2 caracteres');
        return false;
    }
    limpiarError('nombreCompleto');
    return true;
}

function validarEmail(valor) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!valor || !emailRegex.test(valor)) {
        mostrarError('email', 'Por favor ingresa un email válido');
        return false;
    }
    limpiarError('email');
    return true;
}

function validarTelefono(valor) {
    const telefonoRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!valor || !telefonoRegex.test(valor.replace(/\s/g, ''))) {
        mostrarError('telefono', 'Por favor ingresa un teléfono válido');
        return false;
    }
    limpiarError('telefono');
    return true;
}

function validarDireccion(valor) {
    if (!valor || valor.trim().length < 5) {
        mostrarError('direccion', 'La dirección debe tener al menos 5 caracteres');
        return false;
    }
    limpiarError('direccion');
    return true;
}

function validarCiudad(valor) {
    if (!valor || valor.trim().length < 2) {
        mostrarError('ciudad', 'Por favor ingresa una ciudad válida');
        return false;
    }
    limpiarError('ciudad');
    return true;
}

function validarEstado(valor) {
    if (!valor) {
        mostrarError('estado', 'Por favor selecciona un estado');
        return false;
    }
    limpiarError('estado');
    return true;
}

function validarCodigoPostal(valor) {
    if (!valor || valor.trim().length < 4) {
        mostrarError('codigoPostal', 'Por favor ingresa un código postal válido');
        return false;
    }
    limpiarError('codigoPostal');
    return true;
}

// Mostrar error en campo
function mostrarError(campo, mensaje) {
    const input = document.querySelector(`[name="${campo}"]`);
    const errorElement = document.getElementById(`error-${campo}`);
    
    if (input) {
        input.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = mensaje;
        errorElement.classList.add('show');
    }
}

// Limpiar error de campo
function limpiarError(campo) {
    const input = document.querySelector(`[name="${campo}"]`);
    const errorElement = document.getElementById(`error-${campo}`);
    
    if (input) {
        input.classList.remove('error');
    }
    
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

// Actualizar información de envío
function actualizarInformacionEnvio(campo, valor) {
    checkoutState.informacionEnvio[campo] = valor;
    guardarCheckoutEnStorage();
}

// Seleccionar método de envío
function seleccionarMetodoEnvio(metodoId) {
    const metodo = metodosEnvio.find(m => m.id === metodoId);
    
    if (!metodo) return;
    
    // Verificar si aplica envío gratis
    if (metodo.minCompra && checkoutState.resumenPedido.subtotal < metodo.minCompra) {
        mostrarMensajeCheckout(`El envío gratis aplica para compras mayores a $${metodo.minCompra}`, 'error');
        return;
    }
    
    checkoutState.metodoEnvio = { ...metodo, selected: true };
    
    // Actualizar UI
    actualizarUIMetodosEnvio();
    actualizarResumenPedido();
    guardarCheckoutEnStorage();
    
    console.log('Método de envío seleccionado:', metodo);
}

// Seleccionar método de pago
function seleccionarMetodoPago(metodoId) {
    const metodo = metodosPago.find(m => m.id === metodoId);
    
    if (!metodo) return;
    
    checkoutState.metodoPago.tipo = metodoId;
    
    // Mostrar formulario adicional para tarjeta si es necesario
    if (metodoId === 'tarjeta') {
        document.getElementById('credit-card-form').classList.add('show');
    } else {
        document.getElementById('credit-card-form').classList.remove('show');
    }
    
    // Actualizar UI
    actualizarUIMetodosPago();
    guardarCheckoutEnStorage();
    
    console.log('Método de pago seleccionado:', metodo);
}

// Actualizar UI de métodos de envío
function actualizarUIMetodosEnvio() {
    const shippingMethods = document.querySelectorAll('.shipping-method');
    
    shippingMethods.forEach(method => {
        method.classList.remove('selected');
        
        if (method.dataset.methodId === checkoutState.metodoEnvio.id) {
            method.classList.add('selected');
        }
    });
}

// Actualizar UI de métodos de pago
function actualizarUIMetodosPago() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach(method => {
        method.classList.remove('selected');
        
        if (method.dataset.methodId === checkoutState.metodoPago.tipo) {
            method.classList.add('selected');
        }
    });
}

// Validar paso de envío
function validarPasoEnvio() {
    const info = checkoutState.informacionEnvio;
    
    const camposRequeridos = [
        'nombreCompleto', 'email', 'telefono', 'direccion', 'ciudad', 'estado', 'codigoPostal'
    ];
    
    let valido = true;
    
    camposRequeridos.forEach(campo => {
        if (!validarCampo(campo, info[campo])) {
            valido = false;
        }
    });
    
    if (!valido) {
        mostrarMensajeCheckout('Por favor completa todos los campos requeridos correctamente', 'error');
        return false;
    }
    
    return true;
}

// Validar paso de pago
function validarPasoPago() {
    if (!checkoutState.metodoPago.tipo) {
        mostrarMensajeCheckout('Por favor selecciona un método de pago', 'error');
        return false;
    }
    
    // Validación adicional para tarjeta de crédito
    if (checkoutState.metodoPago.tipo === 'tarjeta') {
        if (!validarTarjetaCredito()) {
            return false;
        }
    }
    
    return true;
}

// Validar tarjeta de crédito (simulada)
function validarTarjetaCredito() {
    // En una implementación real, aquí iría la validación de la tarjeta
    const numeroTarjeta = document.querySelector('[name="numeroTarjeta"]')?.value;
    const nombreTitular = document.querySelector('[name="nombreTitular"]')?.value;
    const fechaExpiracion = document.querySelector('[name="fechaExpiracion"]')?.value;
    const cvv = document.querySelector('[name="cvv"]')?.value;
    
    if (!numeroTarjeta || numeroTarjeta.replace(/\s/g, '').length !== 16) {
        mostrarMensajeCheckout('Por favor ingresa un número de tarjeta válido', 'error');
        return false;
    }
    
    if (!nombreTitular || nombreTitular.trim().length < 2) {
        mostrarMensajeCheckout('Por favor ingresa el nombre del titular', 'error');
        return false;
    }
    
    if (!fechaExpiracion || !/^\d{2}\/\d{2}$/.test(fechaExpiracion)) {
        mostrarMensajeCheckout('Por favor ingresa una fecha de expiración válida (MM/AA)', 'error');
        return false;
    }
    
    if (!cvv || cvv.length !== 3) {
        mostrarMensajeCheckout('Por favor ingresa un CVV válido', 'error');
        return false;
    }
    
    return true;
}

// Avanzar al siguiente paso
function avanzarPaso(nuevoPaso) {
    checkoutState.pasoActual = nuevoPaso;
    guardarCheckoutEnStorage();
    renderizarPasoActual();
    actualizarProgreso();
}

// Retroceder al paso anterior
function retrocederPaso(nuevoPaso) {
    checkoutState.pasoActual = nuevoPaso;
    guardarCheckoutEnStorage();
    renderizarPasoActual();
    actualizarProgreso();
}

// Renderizar paso actual
function renderizarPasoActual() {
    // Ocultar todos los pasos primero
    document.querySelectorAll('.checkout-paso').forEach(paso => {
        paso.style.display = 'none';
    });
    
    // Mostrar paso actual
    const pasoActual = document.getElementById(`paso-${checkoutState.pasoActual}`);
    if (pasoActual) {
        pasoActual.style.display = 'block';
    }
    
    // Actualizar acciones
    actualizarAccionesCheckout();
}

// Actualizar barra de progreso
function actualizarProgreso() {
    const steps = document.querySelectorAll('.progress-step');
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        step.classList.remove('active', 'completed');
        
        if (stepNumber < checkoutState.pasoActual) {
            step.classList.add('completed');
        } else if (stepNumber === checkoutState.pasoActual) {
            step.classList.add('active');
        }
    });
}

// Actualizar acciones del checkout
function actualizarAccionesCheckout() {
    // Esta función manejaría la visibilidad de los botones de navegación
    // según el paso actual
}

// Actualizar resumen del pedido
function actualizarResumenPedido() {
    const resumen = checkoutState.resumenPedido;
    const metodoEnvio = checkoutState.metodoEnvio;
    
    // Calcular total con envío
    const totalConEnvio = resumen.subtotal + metodoEnvio.precio;
    
    // Actualizar UI del resumen
    const resumenElement = document.getElementById('order-summary-content');
    if (resumenElement) {
        resumenElement.innerHTML = `
            <div class="summary-items">
                ${resumen.items.map(item => `
                    <div class="summary-item">
                        <img src="${item.imagen}" alt="${item.nombre}" class="summary-item-image">
                        <div class="summary-item-details">
                            <div class="summary-item-name">${item.nombre}</div>
                            <div class="summary-item-info">
                                Talla: ${item.talla} | Cantidad: ${item.cantidad}
                            </div>
                            <div class="summary-item-price">$${(item.precio * item.cantidad).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="summary-totals">
                <div class="summary-line">
                    <span>Subtotal:</span>
                    <span>$${resumen.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-line">
                    <span>Envío:</span>
                    <span class="${metodoEnvio.precio === 0 ? 'shipping-free' : ''}">
                        ${metodoEnvio.precio === 0 ? 'GRATIS' : `$${metodoEnvio.precio.toFixed(2)}`}
                    </span>
                </div>
                ${resumen.subtotal >= 100 ? `
                    <div class="summary-savings">
                        ¡Ahorraste $10 en envío!
                    </div>
                ` : ''}
                <div class="summary-line summary-total">
                    <span>Total:</span>
                    <span>$${totalConEnvio.toFixed(2)}</span>
                </div>
            </div>
        `;
    }
}

// Finalizar pedido
async function finalizarPedido() {
    console.log('Finalizando pedido...');
    
    // Validar paso final
    if (!validarPasoPago()) {
        return;
    }
    
    // Mostrar loading
    const btnFinalizar = document.getElementById('btn-finalizar-pedido');
    const textoOriginal = btnFinalizar.innerHTML;
    btnFinalizar.innerHTML = '<div class="loading"></div> Procesando pedido...';
    btnFinalizar.disabled = true;
    
    try {
        // Simular procesamiento del pedido
        const resultado = await procesarPedido();
        
        if (resultado.exito) {
            // Pedido exitoso
            mostrarConfirmacionPedido(resultado.pedido);
            
            // Limpiar carrito
            vaciarCarrito();
            
            // Limpiar checkout storage
            localStorage.removeItem('checkoutStepUp');
            
        } else {
            throw new Error(resultado.mensaje || 'Error al procesar el pedido');
        }
    } catch (error) {
        console.error('Error al finalizar pedido:', error);
        mostrarMensajeCheckout(error.message, 'error');
        
        // Restaurar botón
        btnFinalizar.innerHTML = textoOriginal;
        btnFinalizar.disabled = false;
    }
}

// Procesar pedido (simulado)
async function procesarPedido() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simular procesamiento exitoso
            resolve({
                exito: true,
                pedido: {
                    id: 'PED' + Date.now(),
                    numero: Math.random().toString(36).substr(2, 9).toUpperCase(),
                    fecha: new Date().toISOString(),
                    total: checkoutState.resumenPedido.subtotal + checkoutState.metodoEnvio.precio,
                    items: checkoutState.resumenPedido.items
                },
                mensaje: 'Pedido procesado exitosamente'
            });
        }, 2000);
    });
}

// Mostrar confirmación de pedido
function mostrarConfirmacionPedido(pedido) {
    // Crear modal de confirmación
    const modalHTML = `
        <div class="popup" style="display: flex;">
            <div class="popup-content" style="max-width: 500px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                <h2 style="color: #27ae60; margin-bottom: 1rem;">¡Pedido Confirmado!</h2>
                <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">
                    Gracias por tu compra, <strong>${checkoutState.informacionEnvio.nombreCompleto}</strong>
                </p>
                
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: var(--border-radius); margin-bottom: 1.5rem;">
                    <p><strong>Número de pedido:</strong> ${pedido.numero}</p>
                    <p><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
                    <p><strong>Método de envío:</strong> ${checkoutState.metodoEnvio.nombre}</p>
                    <p><strong>Fecha estimada de entrega:</strong> ${calcularFechaEntrega()}</p>
                </div>
                
                <p style="margin-bottom: 2rem; color: #666;">
                    Hemos enviado un correo de confirmación a <strong>${checkoutState.informacionEnvio.email}</strong>
                    con todos los detalles de tu pedido.
                </p>
                
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="/" class="btn btn-outline">Seguir Comprando</a>
                    <a href="/cuenta/pedidos" class="btn btn-primary">Ver Mis Pedidos</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Calcular fecha estimada de entrega
function calcularFechaEntrega() {
    const hoy = new Date();
    const diasEnvio = checkoutState.metodoEnvio.tiempo.includes('1-2') ? 2 : 
                     checkoutState.metodoEnvio.tiempo.includes('3-5') ? 4 : 6;
    
    const fechaEntrega = new Date(hoy);
    fechaEntrega.setDate(hoy.getDate() + diasEnvio);
    
    return fechaEntrega.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Mostrar mensajes del checkout
function mostrarMensajeCheckout(mensaje, tipo = 'info') {
    // Implementación similar a la del carrito
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `checkout-mensaje checkout-mensaje-${tipo}`;
    mensajeElement.textContent = mensaje;
    mensajeElement.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#0c5460'};
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        border: 1px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : '#bee5eb'};
        z-index: 10000;
        max-width: 300px;
        box-shadow: var(--shadow);
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(mensajeElement);
    
    setTimeout(() => {
        if (mensajeElement.parentElement) {
            mensajeElement.remove();
        }
    }, 5000);
}

// Guardar estado del checkout en localStorage
function guardarCheckoutEnStorage() {
    try {
        localStorage.setItem('checkoutStepUp', JSON.stringify(checkoutState));
    } catch (error) {
        console.error('Error guardando checkout en storage:', error);
    }
}

// Cargar estado del checkout desde localStorage
function cargarCheckoutDesdeStorage() {
    try {
        const guardado = localStorage.getItem('checkoutStepUp');
        if (guardado) {
            const datos = JSON.parse(guardado);
            checkoutState = { ...checkoutState, ...datos };
            console.log('Checkout cargado desde storage:', checkoutState);
        }
    } catch (error) {
        console.error('Error cargando checkout desde storage:', error);
    }
}

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página de checkout
    if (document.getElementById('checkout-container')) {
        initCheckout();
    }
});