/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
// static/js/checkout.js - Sistema completo de checkout StepUp Shoes

/**
 * Sistema avanzado de checkout
 * Proceso completo de compra con validaciones, pasos y confirmación
 */

class CheckoutSystem {
    constructor() {
        this.state = {
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
                pais: 'Costa Rica',
                instruccionesEspeciales: ''
            },
            metodoEnvio: null,
            metodoPago: {
                tipo: '',
                detalles: {}
            },
            resumenPedido: {},
            cupon: null,
            terminosAceptados: false
        };
        
        this.config = {
            metodosEnvio: [
                {
                    id: 'estandar',
                    nombre: 'Envío Estándar',
                    precio: 10,
                    tiempo: '3-5 días hábiles',
                    descripcion: 'Entrega a domicilio estándar',
                    icono: '🚚'
                },
                {
                    id: 'express',
                    nombre: 'Envío Express',
                    precio: 20,
                    tiempo: '1-2 días hábiles',
                    descripcion: 'Entrega prioritaria',
                    icono: '⚡'
                },
                {
                    id: 'gratis',
                    nombre: 'Envío Gratis',
                    precio: 0,
                    tiempo: '5-7 días hábiles',
                    descripcion: 'Envío gratis en compras mayores a $100',
                    icono: '🎁',
                    minCompra: 100
                }
            ],
            metodosPago: [
                {
                    id: 'tarjeta',
                    nombre: 'Tarjeta de Crédito/Débito',
                    icono: '💳',
                    descripcion: 'Pago seguro con tarjeta',
                    requiereFormulario: true
                },
                {
                    id: 'paypal',
                    nombre: 'PayPal',
                    icono: '🔵',
                    descripcion: 'Pago rápido y seguro con PayPal',
                    requiereFormulario: false
                },
                {
                    id: 'transferencia',
                    nombre: 'Transferencia Bancaria',
                    icono: '🏦',
                    descripcion: 'Transferencia bancaria directa',
                    requiereFormulario: false
                }
            ]
        };
        
        this.validators = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            telefono: /^[\+]?[0-9\s\-\(\)]{8,}$/,
            codigoPostal: /^[0-9]{4,6}$/,
            tarjeta: /^[0-9\s]{13,19}$/,
            cvv: /^[0-9]{3,4}$/,
            fechaExpiracion: /^(0[1-9]|1[0-2])\/[0-9]{2}$/
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Inicializando sistema de checkout StepUp Shoes...');
        
        // Verificar que estamos en la página de checkout
        if (!this.estaEnCheckoutPage()) {
            console.log('❌ No está en página de checkout, abortando inicialización');
            return;
        }
        
        this.cargarDatosIniciales();
        this.setupEventListeners();
        this.setupValidaciones();
        this.renderizarPasoActual();
        this.actualizarProgreso();
        this.actualizarResumenPedido();
        
        console.log('✅ Sistema de checkout inicializado');
    }

    estaEnCheckoutPage() {
        return document.getElementById('checkout-container') !== null;
    }

    cargarDatosIniciales() {
        // Cargar datos del carrito
        this.cargarDatosCarrito();
        
        // Cargar información guardada
        this.cargarDesdeStorage();
        
        // Cargar información del usuario si está autenticado
        this.cargarInformacionUsuario();
    }

    cargarDatosCarrito() {
        if (typeof carritoSystem !== 'undefined') {
            const resumen = carritoSystem.obtenerResumen();
            this.state.resumenPedido = resumen;
            
            // Seleccionar método de envío por defecto
            this.seleccionarMetodoEnvioPorDefecto();
        } else {
            console.error('❌ Sistema del carrito no disponible');
        }
    }

    seleccionarMetodoEnvioPorDefecto() {
        const subtotal = this.state.resumenPedido.subtotal || 0;
        
        if (subtotal >= 100) {
            this.state.metodoEnvio = this.config.metodosEnvio.find(m => m.id === 'gratis');
        } else {
            this.state.metodoEnvio = this.config.metodosEnvio.find(m => m.id === 'estandar');
        }
    }

    cargarInformacionUsuario() {
        if (typeof authSystem !== 'undefined' && authSystem.isAuthenticated()) {
            const usuario = authSystem.getCurrentUser();
            
            // Prellenar información del usuario
            this.state.informacionEnvio = {
                ...this.state.informacionEnvio,
                nombreCompleto: usuario.nombre || '',
                email: usuario.email || ''
            };
            
            // Actualizar formulario
            this.actualizarFormularioEnvio();
        }
    }

    setupEventListeners() {
        // Navegación entre pasos
        this.setupNavegacionPasos();
        
        // Formularios
        this.setupFormularioEnvio();
        this.setupMetodosEnvio();
        this.setupMetodosPago();
        this.setupFormularioTarjeta();
        
        // Cupones
        this.setupCupones();
        
        // Términos y condiciones
        this.setupTerminos();
    }

    setupNavegacionPasos() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Avanzar al paso 2
            if (target.id === 'btn-continuar-paso-1') {
                e.preventDefault();
                this.avanzarPaso(2);
            }
            
            // Avanzar al paso 3
            if (target.id === 'btn-continuar-paso-2') {
                e.preventDefault();
                this.avanzarPaso(3);
            }
            
            // Volver al paso 1
            if (target.id === 'btn-volver-paso-2') {
                e.preventDefault();
                this.retrocederPaso(1);
            }
            
            // Volver al paso 2
            if (target.id === 'btn-volver-paso-3') {
                e.preventDefault();
                this.retrocederPaso(2);
            }
            
            // Finalizar pedido
            if (target.id === 'btn-finalizar-pedido') {
                e.preventDefault();
                this.finalizarPedido();
            }
        });
    }

    setupFormularioEnvio() {
        const formulario = document.getElementById('formulario-envio');
        if (!formulario) return;
        
        // Eventos de input en tiempo real
        formulario.addEventListener('input', (e) => {
            const campo = e.target.name;
            const valor = e.target.value;
            
            this.actualizarInformacionEnvio(campo, valor);
            this.validarCampoEnTiempoReal(campo, valor);
        });
        
        // Eventos de blur para validación
        formulario.addEventListener('blur', (e) => {
            const campo = e.target.name;
            const valor = e.target.value;
            
            this.validarCampo(campo, valor, true);
        }, true);
    }

    setupMetodosEnvio() {
        document.addEventListener('click', (e) => {
            const metodoElement = e.target.closest('.shipping-method');
            if (metodoElement) {
                const metodoId = metodoElement.dataset.methodId;
                this.seleccionarMetodoEnvio(metodoId);
            }
        });
    }

    setupMetodosPago() {
        document.addEventListener('click', (e) => {
            const metodoElement = e.target.closest('.payment-method');
            if (metodoElement) {
                const metodoId = metodoElement.dataset.methodId;
                this.seleccionarMetodoPago(metodoId);
            }
        });
    }

    setupFormularioTarjeta() {
        // Formateo automático de número de tarjeta
        const numeroTarjeta = document.getElementById('numeroTarjeta');
        if (numeroTarjeta) {
            numeroTarjeta.addEventListener('input', (e) => {
                this.formatearNumeroTarjeta(e.target);
                this.actualizarPreviewTarjeta();
            });
        }
        
        // Formateo de fecha de expiración
        const fechaExpiracion = document.getElementById('fechaExpiracion');
        if (fechaExpiracion) {
            fechaExpiracion.addEventListener('input', (e) => {
                this.formatearFechaExpiracion(e.target);
                this.actualizarPreviewTarjeta();
            });
        }
        
        // Actualización de nombre del titular
        const nombreTitular = document.getElementById('nombreTitular');
        if (nombreTitular) {
            nombreTitular.addEventListener('input', (e) => {
                this.actualizarPreviewTarjeta();
            });
        }
    }

    setupCupones() {
        const btnAplicarCupon = document.getElementById('btn-aplicar-cupon');
        const inputCupon = document.getElementById('input-cupon');
        
        if (btnAplicarCupon && inputCupon) {
            btnAplicarCupon.addEventListener('click', () => {
                this.aplicarCupon(inputCupon.value);
            });
            
            inputCupon.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.aplicarCupon(inputCupon.value);
                }
            });
        }
    }

    setupTerminos() {
        const checkboxTerminos = document.getElementById('confirmarTerminos');
        if (checkboxTerminos) {
            checkboxTerminos.addEventListener('change', (e) => {
                this.state.terminosAceptados = e.target.checked;
            });
        }
    }

    setupValidaciones() {
        // Validaciones adicionales pueden ir aquí
    }

    // Navegación entre pasos
    avanzarPaso(nuevoPaso) {
        if (!this.validarPasoActual()) {
            this.mostrarMensaje('Por favor completa todos los campos requeridos correctamente', 'error');
            return;
        }
        
        this.state.pasoActual = nuevoPaso;
        this.guardarEnStorage();
        this.renderizarPasoActual();
        this.actualizarProgreso();
        
        console.log(`➡️ Avanzando al paso ${nuevoPaso}`);
    }

    retrocederPaso(nuevoPaso) {
        this.state.pasoActual = nuevoPaso;
        this.guardarEnStorage();
        this.renderizarPasoActual();
        this.actualizarProgreso();
        
        console.log(`⬅️ Retrocediendo al paso ${nuevoPaso}`);
    }

    validarPasoActual() {
        switch (this.state.pasoActual) {
            case 1:
                return this.validarPasoEnvio();
            case 2:
                return this.validarPasoPago();
            case 3:
                return this.validarPasoConfirmacion();
            default:
                return false;
        }
    }

    validarPasoEnvio() {
        const info = this.state.informacionEnvio;
        const camposRequeridos = [
            'nombreCompleto', 'email', 'telefono', 'direccion', 'ciudad', 'estado', 'codigoPostal'
        ];
        
        let valido = true;
        
        camposRequeridos.forEach(campo => {
            if (!this.validarCampo(campo, info[campo], true)) {
                valido = false;
            }
        });
        
        if (!this.state.metodoEnvio) {
            this.mostrarMensaje('Por favor selecciona un método de envío', 'error');
            valido = false;
        }
        
        return valido;
    }

    validarPasoPago() {
        if (!this.state.metodoPago.tipo) {
            this.mostrarMensaje('Por favor selecciona un método de pago', 'error');
            return false;
        }
        
        if (this.state.metodoPago.tipo === 'tarjeta') {
            return this.validarTarjetaCredito();
        }
        
        return true;
    }

    validarPasoConfirmacion() {
        if (!this.state.terminosAceptados) {
            this.mostrarMensaje('Debes aceptar los términos y condiciones para continuar', 'error');
            return false;
        }
        
        return true;
    }

    // Validaciones de campos
    validarCampo(campo, valor, mostrarError = false) {
        let valido = true;
        let mensaje = '';
        
        switch (campo) {
            case 'nombreCompleto':
                valido = valor && valor.trim().length >= 2;
                mensaje = 'El nombre debe tener al menos 2 caracteres';
                break;
                
            case 'email':
                valido = this.validators.email.test(valor);
                mensaje = 'Por favor ingresa un email válido';
                break;
                
            case 'telefono':
                valido = this.validators.telefono.test(valor.replace(/\s/g, ''));
                mensaje = 'Por favor ingresa un teléfono válido';
                break;
                
            case 'direccion':
                valido = valor && valor.trim().length >= 5;
                mensaje = 'La dirección debe tener al menos 5 caracteres';
                break;
                
            case 'ciudad':
                valido = valor && valor.trim().length >= 2;
                mensaje = 'Por favor ingresa una ciudad válida';
                break;
                
            case 'estado':
                valido = !!valor;
                mensaje = 'Por favor selecciona un estado';
                break;
                
            case 'codigoPostal':
                valido = this.validators.codigoPostal.test(valor);
                mensaje = 'Por favor ingresa un código postal válido';
                break;
        }
        
        if (!valido && mostrarError) {
            this.mostrarErrorCampo(campo, mensaje);
        } else if (valido) {
            this.limpiarErrorCampo(campo);
        }
        
        return valido;
    }

    validarCampoEnTiempoReal(campo, valor) {
        if (valor) {
            this.validarCampo(campo, valor, false);
        } else {
            this.limpiarErrorCampo(campo);
        }
    }

    validarTarjetaCredito() {
        const numeroTarjeta = document.getElementById('numeroTarjeta')?.value;
        const nombreTitular = document.getElementById('nombreTitular')?.value;
        const fechaExpiracion = document.getElementById('fechaExpiracion')?.value;
        const cvv = document.getElementById('cvv')?.value;
        
        let valido = true;
        
        if (!numeroTarjeta || !this.validators.tarjeta.test(numeroTarjeta.replace(/\s/g, ''))) {
            this.mostrarErrorCampo('numeroTarjeta', 'Número de tarjeta inválido');
            valido = false;
        }
        
        if (!nombreTitular || nombreTitular.trim().length < 2) {
            this.mostrarErrorCampo('nombreTitular', 'Nombre del titular requerido');
            valido = false;
        }
        
        if (!fechaExpiracion || !this.validators.fechaExpiracion.test(fechaExpiracion)) {
            this.mostrarErrorCampo('fechaExpiracion', 'Fecha de expiración inválida (MM/AA)');
            valido = false;
        } else if (this.tarjetaExpirada(fechaExpiracion)) {
            this.mostrarErrorCampo('fechaExpiracion', 'La tarjeta está expirada');
            valido = false;
        }
        
        if (!cvv || !this.validators.cvv.test(cvv)) {
            this.mostrarErrorCampo('cvv', 'CVV inválido');
            valido = false;
        }
        
        return valido;
    }

    tarjetaExpirada(fechaExpiracion) {
        const [mes, ano] = fechaExpiracion.split('/');
        const fechaExpiracionDate = new Date(2000 + parseInt(ano), parseInt(mes) - 1);
        const hoy = new Date();
        
        return fechaExpiracionDate < hoy;
    }

    // Métodos de envío y pago
    seleccionarMetodoEnvio(metodoId) {
        const metodo = this.config.metodosEnvio.find(m => m.id === metodoId);
        
        if (!metodo) return;
        
        // Validar envío gratis
        if (metodo.minCompra && this.state.resumenPedido.subtotal < metodo.minCompra) {
            this.mostrarMensaje(`El envío gratis aplica para compras mayores a $${metodo.minCompra}`, 'warning');
            return;
        }
        
        this.state.metodoEnvio = metodo;
        this.actualizarUIMetodosEnvio();
        this.actualizarResumenPedido();
        this.guardarEnStorage();
        
        console.log('🚚 Método de envío seleccionado:', metodo.nombre);
    }

    seleccionarMetodoPago(metodoId) {
        const metodo = this.config.metodosPago.find(m => m.id === metodoId);
        
        if (!metodo) return;
        
        this.state.metodoPago.tipo = metodoId;
        
        // Mostrar/ocultar formulario de tarjeta
        const formularioTarjeta = document.getElementById('credit-card-form');
        if (formularioTarjeta) {
            if (metodo.requiereFormulario) {
                formularioTarjeta.classList.add('show');
            } else {
                formularioTarjeta.classList.remove('show');
            }
        }
        
        this.actualizarUIMetodosPago();
        this.guardarEnStorage();
        
        console.log('💳 Método de pago seleccionado:', metodo.nombre);
    }

    aplicarCupon(codigo) {
        if (!codigo) {
            this.mostrarMensaje('Por favor ingresa un código de cupón', 'error');
            return;
        }
        
        // Simular validación de cupón
        const cuponesValidos = {
            'STEPUP10': { descuento: 10, tipo: 'porcentaje' },
            'ENVIOGRATIS': { descuento: 100, tipo: 'envio' },
            'BIENVENIDA20': { descuento: 20, tipo: 'porcentaje', max: 50 }
        };
        
        const cupon = cuponesValidos[codigo.toUpperCase()];
        
        if (cupon) {
            this.state.cupon = { codigo, ...cupon };
            this.actualizarResumenPedido();
            this.mostrarMensaje('¡Cupón aplicado correctamente!', 'success');
        } else {
            this.mostrarMensaje('Cupón inválido o expirado', 'error');
        }
    }

    // UI Updates
    renderizarPasoActual() {
        // Ocultar todos los pasos
        document.querySelectorAll('.checkout-paso').forEach(paso => {
            paso.style.display = 'none';
        });
        
        // Mostrar paso actual
        const pasoActual = document.getElementById(`paso-${this.state.pasoActual}`);
        if (pasoActual) {
            pasoActual.style.display = 'block';
            pasoActual.classList.add('fade-in');
        }
        
        // Actualizar acciones específicas del paso
        this.actualizarAccionesPaso();
    }

    actualizarProgreso() {
        const steps = document.querySelectorAll('.progress-step');
        
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.state.pasoActual) {
                step.classList.add('completed');
            } else if (stepNumber === this.state.pasoActual) {
                step.classList.add('active');
            }
        });
    }

    actualizarAccionesPaso() {
        // Lógica para habilitar/deshabilitar botones según el paso
        // y las validaciones correspondientes
    }

    actualizarUIMetodosEnvio() {
        const methods = document.querySelectorAll('.shipping-method');
        
        methods.forEach(method => {
            method.classList.remove('selected');
            
            if (this.state.metodoEnvio && method.dataset.methodId === this.state.metodoEnvio.id) {
                method.classList.add('selected');
            }
        });
    }

    actualizarUIMetodosPago() {
        const methods = document.querySelectorAll('.payment-method');
        
        methods.forEach(method => {
            method.classList.remove('selected');
            
            if (method.dataset.methodId === this.state.metodoPago.tipo) {
                method.classList.add('selected');
            }
        });
    }

    actualizarFormularioEnvio() {
        const form = document.getElementById('formulario-envio');
        if (!form) return;
        
        Object.keys(this.state.informacionEnvio).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = this.state.informacionEnvio[key] || '';
            }
        });
    }

    actualizarResumenPedido() {
        const resumenElement = document.getElementById('order-summary-content');
        if (!resumenElement) return;
        
        const resumen = this.calcularResumenCompleto();
        
        resumenElement.innerHTML = this.renderResumenPedido(resumen);
        
        // Actualizar confirmación en paso 3
        this.actualizarConfirmacionPedido();
    }

    calcularResumenCompleto() {
        const subtotal = this.state.resumenPedido.subtotal || 0;
        const envio = this.state.metodoEnvio ? this.state.metodoEnvio.precio : 0;
        let descuento = 0;
        
        // Aplicar cupón
        if (this.state.cupon) {
            if (this.state.cupon.tipo === 'porcentaje') {
                descuento = (subtotal * this.state.cupon.descuento) / 100;
                if (this.state.cupon.max) {
                    descuento = Math.min(descuento, this.state.cupon.max);
                }
            } else if (this.state.cupon.tipo === 'envio') {
                descuento = envio;
            }
        }
        
        const total = subtotal + envio - descuento;
        
        return {
            subtotal,
            envio,
            descuento,
            total,
            items: this.state.resumenPedido.items || [],
            tieneDescuento: descuento > 0,
            cupon: this.state.cupon
        };
    }

    renderResumenPedido(resumen) {
        return `
            <div class="summary-items">
                ${resumen.items.map(item => `
                    <div class="summary-item">
                        <img src="${item.imagen}" alt="${item.nombre}" class="summary-item-image"
                             onerror="this.src='/images/placeholder-producto.jpg'">
                        <div class="summary-item-details">
                            <div class="summary-item-name">${item.nombre}</div>
                            <div class="summary-item-info">
                                ${item.talla ? `Talla: ${item.talla}` : ''} 
                                ${item.talla ? '•' : ''} 
                                Cantidad: ${item.cantidad}
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
                
                ${resumen.tieneDescuento ? `
                    <div class="summary-line summary-descuento">
                        <span>Descuento (${resumen.cupon.codigo}):</span>
                        <span class="descuento-valor">-$${resumen.descuento.toFixed(2)}</span>
                    </div>
                ` : ''}
                
                <div class="summary-line">
                    <span>Envío:</span>
                    <span class="${resumen.envio === 0 ? 'shipping-free' : ''}">
                        ${resumen.envio === 0 ? 'GRATIS' : `$${resumen.envio.toFixed(2)}`}
                    </span>
                </div>
                
                ${resumen.envio === 0 && this.state.metodoEnvio?.id === 'gratis' ? `
                    <div class="summary-savings">
                        <span class="savings-icon">🎉</span>
                        ¡Ahorraste $${(this.config.metodosEnvio.find(m => m.id === 'estandar').precio).toFixed(2)} en envío!
                    </div>
                ` : ''}
                
                <div class="summary-line summary-total">
                    <span>Total:</span>
                    <span>$${resumen.total.toFixed(2)}</span>
                </div>
            </div>
            
            ${!resumen.tieneDescuento ? `
                <div class="summary-cupon">
                    <div class="cupon-input-group">
                        <input type="text" id="input-cupon" placeholder="Código de cupón" class="cupon-input">
                        <button type="button" id="btn-aplicar-cupon" class="btn-cupon">Aplicar</button>
                    </div>
                </div>
            ` : ''}
        `;
    }

    actualizarConfirmacionPedido() {
        if (this.state.pasoActual !== 3) return;
        
        const direccionCompleta = `
            ${this.state.informacionEnvio.direccion}, 
            ${this.state.informacionEnvio.ciudad}, 
            ${this.state.informacionEnvio.estado}, 
            ${this.state.informacionEnvio.codigoPostal}
        `;
        
        document.getElementById('confirmacion-direccion').textContent = direccionCompleta;
        document.getElementById('confirmacion-envio').textContent = this.state.metodoEnvio?.nombre || 'No seleccionado';
        document.getElementById('confirmacion-pago').textContent = 
            this.config.metodosPago.find(m => m.id === this.state.metodoPago.tipo)?.nombre || 'No seleccionado';
        document.getElementById('confirmacion-fecha').textContent = this.calcularFechaEntrega();
    }

    // Formateo de inputs
    formatearNumeroTarjeta(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        value = value.substring(0, 19);
        input.value = value;
    }

    formatearFechaExpiracion(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    actualizarPreviewTarjeta() {
        const numero = document.getElementById('numeroTarjeta')?.value || '•••• •••• •••• ••••';
        const nombre = document.getElementById('nombreTitular')?.value || 'NOMBRE APELLIDO';
        const fecha = document.getElementById('fechaExpiracion')?.value || 'MM/AA';
        
        document.getElementById('cardPreviewNumber').textContent = numero;
        document.getElementById('cardPreviewHolder').textContent = nombre.toUpperCase();
        document.getElementById('cardPreviewExpiry').textContent = fecha;
    }

    // Finalización del pedido
    async finalizarPedido() {
        console.log('🎯 Finalizando pedido...');
        
        if (!this.validarPasoConfirmacion()) {
            return;
        }
        
        const btnFinalizar = document.getElementById('btn-finalizar-pedido');
        const textoOriginal = btnFinalizar.innerHTML;
        
        this.mostrarLoading(btnFinalizar, 'Procesando pedido...');
        
        try {
            const resultado = await this.procesarPedido();
            
            if (resultado.exito) {
                await this.mostrarConfirmacionExitosa(resultado.pedido);
            } else {
                throw new Error(resultado.mensaje || 'Error al procesar el pedido');
            }
        } catch (error) {
            console.error('❌ Error al finalizar pedido:', error);
            this.mostrarMensaje(error.message, 'error');
            this.ocultarLoading(btnFinalizar, textoOriginal);
        }
    }

    async procesarPedido() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simular procesamiento exitoso
                const pedido = {
                    id: 'PED' + Date.now(),
                    numero: Math.random().toString(36).substr(2, 9).toUpperCase(),
                    fecha: new Date().toISOString(),
                    ...this.calcularResumenCompleto(),
                    informacionEnvio: this.state.informacionEnvio,
                    metodoEnvio: this.state.metodoEnvio,
                    metodoPago: this.state.metodoPago
                };
                
                resolve({
                    exito: true,
                    pedido: pedido,
                    mensaje: 'Pedido procesado exitosamente'
                });
            }, 3000);
        });
    }

    async mostrarConfirmacionExitosa(pedido) {
        // Limpiar carrito
        if (typeof carritoSystem !== 'undefined') {
            carritoSystem.vaciarCarrito();
        }
        
        // Limpiar storage
        this.limpiarStorage();
        
        // Mostrar modal de confirmación
        this.mostrarModalConfirmacion(pedido);
    }

    mostrarModalConfirmacion(pedido) {
        const modalHTML = `
            <div class="popup" id="popup-confirmacion" style="display: flex;">
                <div class="popup-content confirmacion-content">
                    <div class="confirmacion-header">
                        <div class="confirmacion-icon">🎉</div>
                        <h2>¡Pedido Confirmado!</h2>
                        <p class="confirmacion-subtitle">Gracias por tu compra en StepUp Shoes</p>
                    </div>
                    
                    <div class="confirmacion-body">
                        <div class="confirmacion-datos">
                            <div class="dato-item">
                                <span class="dato-label">Número de pedido:</span>
                                <span class="dato-valor">${pedido.numero}</span>
                            </div>
                            <div class="dato-item">
                                <span class="dato-label">Fecha:</span>
                                <span class="dato-valor">${new Date(pedido.fecha).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div class="dato-item">
                                <span class="dato-label">Total:</span>
                                <span class="dato-valor">$${pedido.total.toFixed(2)}</span>
                            </div>
                            <div class="dato-item">
                                <span class="dato-label">Método de envío:</span>
                                <span class="dato-valor">${pedido.metodoEnvio.nombre}</span>
                            </div>
                            <div class="dato-item">
                                <span class="dato-label">Fecha estimada de entrega:</span>
                                <span class="dato-valor">${this.calcularFechaEntrega()}</span>
                            </div>
                        </div>
                        
                        <div class="confirmacion-mensaje">
                            <p>Hemos enviado un correo de confirmación a <strong>${this.state.informacionEnvio.email}</strong> 
                            con todos los detalles de tu pedido y información de seguimiento.</p>
                        </div>
                    </div>
                    
                    <div class="confirmacion-actions">
                        <a href="/" class="btn btn-outline">
                            <span class="btn-icon">🏠</span>
                            Seguir Comprando
                        </a>
                        <a href="/cuenta/pedidos" class="btn btn-primary">
                            <span class="btn-icon">📦</span>
                            Ver Mis Pedidos
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Utilidades
    calcularFechaEntrega() {
        if (!this.state.metodoEnvio) return 'No disponible';
        
        const hoy = new Date();
        let diasSumar = 5; // Por defecto
        
        if (this.state.metodoEnvio.tiempo.includes('1-2')) {
            diasSumar = 2;
        } else if (this.state.metodoEnvio.tiempo.includes('3-5')) {
            diasSumar = 4;
        }
        
        const fechaEntrega = new Date(hoy);
        fechaEntrega.setDate(hoy.getDate() + diasSumar);
        
        return fechaEntrega.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    actualizarInformacionEnvio(campo, valor) {
        this.state.informacionEnvio[campo] = valor;
        this.guardarEnStorage();
    }

    mostrarErrorCampo(campo, mensaje) {
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

    limpiarErrorCampo(campo) {
        const input = document.querySelector(`[name="${campo}"]`);
        const errorElement = document.getElementById(`error-${campo}`);
        
        if (input) {
            input.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    mostrarLoading(elemento, texto) {
        elemento.disabled = true;
        elemento.innerHTML = `
            <span class="loading-spinner"></span>
            ${texto}
        `;
    }

    ocultarLoading(elemento, textoOriginal) {
        elemento.disabled = false;
        elemento.innerHTML = textoOriginal;
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        if (typeof authSystem !== 'undefined') {
            authSystem.showToast(mensaje, tipo);
        } else {
            // Fallback simple
            alert(mensaje);
        }
    }

    // Almacenamiento
    guardarEnStorage() {
        try {
            localStorage.setItem('stepup_checkout', JSON.stringify(this.state));
        } catch (error) {
            console.error('❌ Error guardando checkout:', error);
        }
    }

    cargarDesdeStorage() {
        try {
            const guardado = localStorage.getItem('stepup_checkout');
            if (guardado) {
                const datos = JSON.parse(guardado);
                this.state = { ...this.state, ...datos };
                console.log('📥 Checkout cargado desde storage');
            }
        } catch (error) {
            console.error('❌ Error cargando checkout:', error);
        }
    }

    limpiarStorage() {
        localStorage.removeItem('stepup_checkout');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    new CheckoutSystem();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckoutSystem;
}