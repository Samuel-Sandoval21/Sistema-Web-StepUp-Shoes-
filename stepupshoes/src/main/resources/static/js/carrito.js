/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
// static/js/carrito.js - Sistema completo del carrito StepUp Shoes

/**
 * Sistema avanzado del carrito de compras
 * Gestión completa de productos, cantidades, precios y checkout
 */

class CarritoSystem {
    constructor() {
        this.state = {
            items: [],
            subtotal: 0,
            envio: 0,
            total: 0,
            envioGratis: 100,
            descuentos: [],
            lastUpdated: null
        };
        
        this.config = {
            maxCantidadPorProducto: 10,
            tiempoExpiracion: 24 * 60 * 60 * 1000, // 24 horas
            autoGuardar: true
        };
        
        this.init();
    }

    init() {
        console.log('🛒 Inicializando sistema del carrito StepUp Shoes...');
        
        this.cargarDesdeStorage();
        this.setupEventListeners();
        this.actualizarUICarrito();
        
        console.log('✅ Carrito inicializado:', this.state.items.length + ' productos');
    }

    setupEventListeners() {
        // Event delegation para acciones del carrito
        document.addEventListener('click', (e) => {
            // Eliminar item
            if (e.target.closest('.carrito-item-eliminar')) {
                const itemId = e.target.closest('.carrito-item-eliminar').dataset.itemId;
                this.eliminarItem(itemId);
            }
            
            // Disminuir cantidad
            if (e.target.closest('.cantidad-decrementar')) {
                const itemId = e.target.closest('.cantidad-decrementar').dataset.itemId;
                this.modificarCantidad(itemId, -1);
            }
            
            // Aumentar cantidad
            if (e.target.closest('.cantidad-incrementar')) {
                const itemId = e.target.closest('.cantidad-incrementar').dataset.itemId;
                this.modificarCantidad(itemId, 1);
            }
            
            // Vaciar carrito
            if (e.target.closest('.btn-vaciar-carrito')) {
                this.vaciarCarrito();
            }
        });

        // Input directo de cantidad
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('cantidad-input-directo')) {
                const itemId = e.target.dataset.itemId;
                const nuevaCantidad = parseInt(e.target.value);
                this.establecerCantidad(itemId, nuevaCantidad);
            }
        });

        // Cierre del carrito
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('carrito-close') || 
                (e.target.classList.contains('popup') && e.target.id === 'popup-carrito')) {
                this.cerrarCarrito();
            }
        });

        // Tecla Escape para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.estaCarritoAbierto()) {
                this.cerrarCarrito();
            }
        });
    }

    agregarProducto(productoId, talla = null, cantidad = 1, opciones = {}) {
        console.log('➕ Agregando producto al carrito:', { productoId, talla, cantidad, opciones });
        
        // Verificar autenticación
        if (!this.verificarAutenticacion()) {
            this.mostrarMensaje('Debes iniciar sesión para agregar productos al carrito', 'error');
            authSystem.showLogin();
            return false;
        }
        
        // Validar parámetros
        if (!productoId || cantidad < 1) {
            this.mostrarMensaje('Parámetros inválidos', 'error');
            return false;
        }
        
        // Obtener información del producto
        const producto = this.obtenerInformacionProducto(productoId);
        if (!producto) {
            this.mostrarMensaje('Producto no encontrado', 'error');
            return false;
        }
        
        // Validar talla si es necesario
        if (producto.requiereTalla && !talla) {
            this.mostrarSeleccionTalla(productoId, cantidad, opciones);
            return false;
        }
        
        // Validar stock
        if (!this.validarStock(producto, talla, cantidad)) {
            this.mostrarMensaje('Stock insuficiente para este producto', 'error');
            return false;
        }
        
        // Crear item del carrito
        const itemCarrito = {
            id: this.generarIdUnico(),
            productoId: productoId,
            nombre: producto.nombre,
            precio: producto.precio,
            precioOriginal: producto.precioOriginal || producto.precio,
            imagen: producto.imagenUrl || '/images/placeholder-producto.jpg',
            talla: talla,
            cantidad: cantidad,
            stock: producto.stock,
            maxPorPedido: producto.maxPorPedido || this.config.maxCantidadPorProducto,
            categoria: producto.categoria,
            marca: producto.marca,
            opciones: opciones,
            agregadoEn: new Date().toISOString(),
            sku: producto.sku
        };
        
        // Verificar si ya existe
        const itemExistente = this.buscarItemExistente(productoId, talla, opciones);
        
        if (itemExistente) {
            return this.actualizarItemExistente(itemExistente, cantidad);
        } else {
            return this.agregarNuevoItem(itemCarrito);
        }
    }

    buscarItemExistente(productoId, talla, opciones) {
        return this.state.items.find(item => 
            item.productoId === productoId && 
            item.talla === talla &&
            this.compararOpciones(item.opciones, opciones)
        );
    }

    compararOpciones(opciones1, opciones2) {
        const keys1 = Object.keys(opciones1 || {});
        const keys2 = Object.keys(opciones2 || {});
        
        if (keys1.length !== keys2.length) return false;
        
        return keys1.every(key => opciones1[key] === opciones2[key]);
    }

    actualizarItemExistente(itemExistente, cantidadAdicional) {
        const nuevaCantidad = itemExistente.cantidad + cantidadAdicional;
        
        // Validar límites
        if (nuevaCantidad > itemExistente.maxPorPedido) {
            this.mostrarMensaje(`Máximo ${itemExistente.maxPorPedido} unidades por pedido`, 'error');
            return false;
        }
        
        if (nuevaCantidad > itemExistente.stock) {
            this.mostrarMensaje('Stock insuficiente', 'error');
            return false;
        }
        
        itemExistente.cantidad = nuevaCantidad;
        this.actualizarCalculos();
        this.guardarEnStorage();
        this.actualizarUICarrito();
        
        this.mostrarMensaje(`Cantidad actualizada: ${itemExistente.nombre}`, 'success');
        return true;
    }

    agregarNuevoItem(item) {
        this.state.items.push(item);
        this.actualizarCalculos();
        this.guardarEnStorage();
        this.actualizarUICarrito();
        
        this.mostrarMensaje('Producto agregado al carrito', 'success');
        
        // Mostrar carrito automáticamente
        setTimeout(() => {
            this.mostrarCarrito();
        }, 800);
        
        return true;
    }

    eliminarItem(itemId) {
        console.log('🗑️ Eliminando item del carrito:', itemId);
        
        const itemIndex = this.state.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const itemEliminado = this.state.items[itemIndex];
        this.state.items.splice(itemIndex, 1);
        
        this.actualizarCalculos();
        this.guardarEnStorage();
        this.actualizarUICarrito();
        
        this.mostrarMensaje(`${itemEliminado.nombre} eliminado del carrito`, 'info');
    }

    modificarCantidad(itemId, cambio) {
        const item = this.state.items.find(item => item.id === itemId);
        if (!item) return;
        
        const nuevaCantidad = item.cantidad + cambio;
        
        if (nuevaCantidad < 1) {
            this.eliminarItem(itemId);
            return;
        }
        
        if (nuevaCantidad > item.maxPorPedido) {
            this.mostrarMensaje(`Máximo ${item.maxPorPedido} unidades por pedido`, 'error');
            return;
        }
        
        if (nuevaCantidad > item.stock) {
            this.mostrarMensaje('Stock insuficiente', 'error');
            return;
        }
        
        item.cantidad = nuevaCantidad;
        this.actualizarCalculos();
        this.guardarEnStorage();
        this.actualizarUICarrito();
    }

    establecerCantidad(itemId, nuevaCantidad) {
        if (nuevaCantidad < 1) {
            this.eliminarItem(itemId);
            return;
        }
        
        const item = this.state.items.find(item => item.id === itemId);
        if (!item) return;
        
        if (nuevaCantidad > item.maxPorPedido) {
            this.mostrarMensaje(`Máximo ${item.maxPorPedido} unidades por pedido`, 'error');
            return;
        }
        
        if (nuevaCantidad > item.stock) {
            this.mostrarMensaje('Stock insuficiente', 'error');
            return;
        }
        
        item.cantidad = nuevaCantidad;
        this.actualizarCalculos();
        this.guardarEnStorage();
        this.actualizarUICarrito();
    }

    actualizarCalculos() {
        // Subtotal
        this.state.subtotal = this.state.items.reduce((total, item) => {
            return total + (item.precio * item.cantidad);
        }, 0);
        
        // Aplicar descuentos
        const descuentosAplicados = this.aplicarDescuentos();
        
        // Calcular envío
        this.state.envio = this.calcularEnvio();
        
        // Total
        this.state.total = this.state.subtotal - descuentosAplicados + this.state.envio;
        
        // Actualizar timestamp
        this.state.lastUpdated = new Date().toISOString();
        
        console.log('💰 Totales actualizados:', this.state);
    }

    calcularEnvio() {
        if (this.state.subtotal >= this.state.envioGratis) {
            return 0;
        }
        
        // Lógica de cálculo de envío basada en ubicación, peso, etc.
        const envioBase = 10;
        const itemsPesados = this.state.items.filter(item => item.categoria === 'zapatillas').length;
        const recargoPeso = itemsPesados * 2;
        
        return envioBase + recargoPeso;
    }

    aplicarDescuentos() {
        let totalDescuentos = 0;
        
        // Descuento por envío gratis implícito
        if (this.state.subtotal >= this.state.envioGratis) {
            totalDescuentos += this.calcularEnvio(); // Considerar el envío como descuento
        }
        
        // Aquí se pueden agregar más reglas de descuento
        // - Cupones
        // - Descuentos por volumen
        // - Promociones especiales
        
        this.state.descuentos = totalDescuentos > 0 ? [{ tipo: 'envio_gratis', valor: totalDescuentos }] : [];
        return totalDescuentos;
    }

    actualizarUICarrito() {
        this.actualizarContadorHeader();
        
        if (this.estaCarritoAbierto()) {
            this.renderizarPopupCarrito();
        }
    }

    actualizarContadorHeader() {
        const totalItems = this.state.items.reduce((total, item) => total + item.cantidad, 0);
        
        // Actualizar todos los contadores
        const contadores = document.querySelectorAll('#carrito-count, #carrito-count-mobile, .carrito-count');
        contadores.forEach(contador => {
            contador.textContent = totalItems;
            
            // Agregar animación si hay cambios
            if (totalItems > 0) {
                contador.classList.add('pulse');
                setTimeout(() => contador.classList.remove('pulse'), 300);
            }
        });
    }

    renderizarPopupCarrito() {
        const carritoContent = document.getElementById('carrito-content');
        if (!carritoContent) return;
        
        if (this.state.items.length === 0) {
            carritoContent.innerHTML = this.renderCarritoVacio();
        } else {
            carritoContent.innerHTML = this.renderCarritoConItems();
        }
    }

    renderCarritoVacio() {
        return `
            <div class="carrito-vacio">
                <div class="empty-icon">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Descubre nuestras increíbles zapatillas y empieza a comprar</p>
                <div class="carrito-vacio-actions">
                    <button class="btn btn-primary" onclick="carritoSystem.cerrarCarrito(); navegarA('/catalogo')">
                        <span class="btn-icon">👟</span>
                        Ver Catálogo
                    </button>
                    <button class="btn btn-outline" onclick="carritoSystem.cerrarCarrito()">
                        <span class="btn-icon">↩️</span>
                        Seguir Navegando
                    </button>
                </div>
            </div>
        `;
    }

    renderCarritoConItems() {
        const tieneEnvioGratis = this.state.subtotal >= this.state.envioGratis;
        const faltaParaEnvioGratis = this.state.envioGratis - this.state.subtotal;
        
        return `
            <div class="carrito-header">
                <h2>Tu Carrito de Compras</h2>
                <button class="carrito-close" title="Cerrar carrito">×</button>
            </div>
            
            <div class="carrito-items">
                ${this.state.items.map(item => this.renderItemCarrito(item)).join('')}
            </div>
            
            ${!tieneEnvioGratis && faltaParaEnvioGratis > 0 ? `
                <div class="carrito-promociones">
                    <div class="promo-icon">🚚</div>
                    <div class="promo-content">
                        <h4>¡Envío gratis cerca!</h4>
                        <p>Falta <strong>$${faltaParaEnvioGratis.toFixed(2)}</strong> para obtener envío gratis</p>
                        <div class="promo-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(this.state.subtotal / this.state.envioGratis) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${tieneEnvioGratis ? `
                <div class="carrito-promociones carrito-promociones-success">
                    <div class="promo-icon">🎉</div>
                    <div class="promo-content">
                        <h4>¡Envío gratis aplicado!</h4>
                        <p>Has ahorrado <strong>$${this.state.envio.toFixed(2)}</strong> en envío</p>
                    </div>
                </div>
            ` : ''}
            
            <div class="carrito-resumen">
                <div class="resumen-linea">
                    <span>Subtotal (${this.obtenerTotalProductos()} productos):</span>
                    <span>$${this.state.subtotal.toFixed(2)}</span>
                </div>
                
                ${this.state.descuentos.length > 0 ? `
                    <div class="resumen-linea resumen-descuento">
                        <span>Descuentos:</span>
                        <span class="descuento-valor">-$${this.state.descuentos.reduce((acc, desc) => acc + desc.valor, 0).toFixed(2)}</span>
                    </div>
                ` : ''}
                
                <div class="resumen-linea">
                    <span>Envío:</span>
                    <span class="resumen-envio ${this.state.envio === 0 ? 'gratis' : 'pago'}">
                        ${this.state.envio === 0 ? 'GRATIS' : `$${this.state.envio.toFixed(2)}`}
                    </span>
                </div>
                
                <div class="resumen-linea resumen-total">
                    <span>Total:</span>
                    <span>$${this.state.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="carrito-actions">
                <button class="btn-carrito btn-carrito-continuar" onclick="carritoSystem.cerrarCarrito()">
                    <span class="btn-icon">←</span>
                    Continuar Comprando
                </button>
                <button class="btn-carrito btn-carrito-finalizar" onclick="carritoSystem.finalizarCompra()">
                    <span class="btn-icon">🚀</span>
                    Finalizar Compra
                </button>
            </div>
            
            <div class="carrito-security">
                <div class="security-feature">
                    <span class="security-icon">🔒</span>
                    <span>Compra 100% segura</span>
                </div>
                <div class="security-feature">
                    <span class="security-icon">↩️</span>
                    <span>Devoluciones gratis en 30 días</span>
                </div>
            </div>
        `;
    }

    renderItemCarrito(item) {
        const esStockBajo = item.cantidad >= item.stock;
        const porcentajeStock = (item.stock - item.cantidad) / item.maxPorPedido * 100;
        
        return `
            <div class="carrito-item" data-item-id="${item.id}">
                <div class="carrito-item-imagen-container">
                    <img src="${item.imagen}" alt="${item.nombre}" class="carrito-item-imagen" 
                         onerror="this.src='/images/placeholder-producto.jpg'">
                    ${item.cantidad > 1 ? `
                        <div class="carrito-item-cantidad-badge">${item.cantidad}</div>
                    ` : ''}
                </div>
                
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-detalles">
                        ${item.talla ? `<span class="carrito-item-talla">Talla: ${item.talla}</span>` : ''}
                        ${item.marca ? `<span class="carrito-item-marca">${item.marca}</span>` : ''}
                        <span class="carrito-item-precio-unit">$${item.precio.toFixed(2)} c/u</span>
                    </div>
                    
                    <div class="carrito-item-stock-info ${esStockBajo ? 'stock-bajo' : 'stock-disponible'}">
                        <div class="stock-indicator">
                            <div class="stock-bar">
                                <div class="stock-fill" style="width: ${porcentajeStock}%"></div>
                            </div>
                            <span class="stock-text">
                                ${esStockBajo ? '¡Últimas unidades!' : `${item.stock - item.cantidad} disponibles`}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="carrito-item-cantidad">
                    <button class="cantidad-btn cantidad-decrementar ${item.cantidad <= 1 ? 'disabled' : ''}" 
                            data-item-id="${item.id}" title="Disminuir">
                        −
                    </button>
                    
                    <div class="cantidad-controls">
                        <input type="number" 
                               class="cantidad-input-directo" 
                               data-item-id="${item.id}"
                               value="${item.cantidad}" 
                               min="1" 
                               max="${item.maxPorPedido}"
                               aria-label="Cantidad de ${item.nombre}">
                        <span class="cantidad-max">max: ${item.maxPorPedido}</span>
                    </div>
                    
                    <button class="cantidad-btn cantidad-incrementar ${item.cantidad >= item.maxPorPedido ? 'disabled' : ''}" 
                            data-item-id="${item.id}" title="Aumentar">
                        +
                    </button>
                </div>
                
                <div class="carrito-item-total">
                    $${(item.precio * item.cantidad).toFixed(2)}
                </div>
                
                <button class="carrito-item-eliminar" data-item-id="${item.id}" title="Eliminar producto">
                    <span class="eliminar-icon">🗑️</span>
                </button>
            </div>
        `;
    }

    obtenerTotalProductos() {
        return this.state.items.reduce((total, item) => total + item.cantidad, 0);
    }

    mostrarCarrito() {
        console.log('📦 Mostrando carrito...');
        
        this.renderizarPopupCarrito();
        document.getElementById('popup-carrito').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Animar entrada
        const popup = document.getElementById('popup-carrito');
        popup.classList.add('popup-active');
    }

    cerrarCarrito() {
        const popup = document.getElementById('popup-carrito');
        if (popup) {
            popup.classList.remove('popup-active');
            setTimeout(() => {
                popup.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    estaCarritoAbierto() {
        const popup = document.getElementById('popup-carrito');
        return popup && popup.style.display === 'flex';
    }

    finalizarCompra() {
        console.log('🚀 Iniciando proceso de checkout...');
        
        // Verificar autenticación
        if (!this.verificarAutenticacion()) {
            this.mostrarMensaje('Debes iniciar sesión para finalizar la compra', 'error');
            authSystem.showLogin();
            return;
        }
        
        // Validar carrito
        if (this.state.items.length === 0) {
            this.mostrarMensaje('El carrito está vacío', 'error');
            return;
        }
        
        // Verificar stock
        if (!this.verificarStockDisponible()) {
            this.mostrarMensaje('Algunos productos ya no tienen stock disponible', 'error');
            return;
        }
        
        // Redirigir al checkout
        this.cerrarCarrito();
        setTimeout(() => {
            window.location.href = '/checkout';
        }, 500);
    }

    vaciarCarrito() {
        if (this.state.items.length === 0) return;
        
        if (confirm('¿Estás seguro de que quieres vaciar el carrito? Se eliminarán todos los productos.')) {
            this.state.items = [];
            this.actualizarCalculos();
            this.guardarEnStorage();
            this.actualizarUICarrito();
            this.mostrarMensaje('Carrito vaciado', 'info');
        }
    }

    verificarAutenticacion() {
        return authSystem.isAuthenticated();
    }

    verificarStockDisponible() {
        // En una implementación real, aquí se verificaría con el servidor
        return this.state.items.every(item => item.cantidad <= item.stock);
    }

    // Almacenamiento
    cargarDesdeStorage() {
        try {
            const carritoGuardado = localStorage.getItem('stepup_carrito');
            const timestampGuardado = localStorage.getItem('stepup_carrito_timestamp');
            
            if (carritoGuardado && timestampGuardado) {
                const tiempoTranscurrido = Date.now() - parseInt(timestampGuardado);
                
                if (tiempoTranscurrido < this.config.tiempoExpiracion) {
                    const datos = JSON.parse(carritoGuardado);
                    this.state.items = datos.items || [];
                    this.state.subtotal = datos.subtotal || 0;
                    this.state.envio = datos.envio || 0;
                    this.state.total = datos.total || 0;
                    console.log('📥 Carrito cargado desde storage:', this.state.items.length + ' items');
                } else {
                    console.log('🕒 Carrito expirado, limpiando...');
                    this.limpiarStorage();
                }
            }
        } catch (error) {
            console.error('❌ Error cargando carrito:', error);
            this.limpiarStorage();
        }
        
        this.actualizarCalculos();
    }

    guardarEnStorage() {
        if (!this.config.autoGuardar) return;
        
        try {
            localStorage.setItem('stepup_carrito', JSON.stringify({
                items: this.state.items,
                subtotal: this.state.subtotal,
                envio: this.state.envio,
                total: this.state.total
            }));
            localStorage.setItem('stepup_carrito_timestamp', Date.now().toString());
        } catch (error) {
            console.error('❌ Error guardando carrito:', error);
        }
    }

    limpiarStorage() {
        localStorage.removeItem('stepup_carrito');
        localStorage.removeItem('stepup_carrito_timestamp');
        this.state.items = [];
        this.actualizarCalculos();
    }

    // Utilidades
    generarIdUnico() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    obtenerInformacionProducto(productoId) {
        // Simulación - reemplazar con API real
        const productos = {
            1: {
                id: 1,
                nombre: 'Nike Air Max 270',
                precio: 129.99,
                precioOriginal: 149.99,
                imagenUrl: '/images/nike-air-max-270.jpg',
                stock: 15,
                maxPorPedido: 5,
                requiereTalla: true,
                tallasDisponibles: [38, 39, 40, 41, 42, 43],
                categoria: 'running',
                marca: 'Nike',
                sku: 'NK-AM270-001'
            },
            2: {
                id: 2,
                nombre: 'Adidas Ultraboost 22',
                precio: 179.99,
                precioOriginal: 199.99,
                imagenUrl: '/images/adidas-ultraboost-22.jpg',
                stock: 20,
                maxPorPedido: 3,
                requiereTalla: true,
                tallasDisponibles: [39, 40, 41, 42, 43, 44],
                categoria: 'running',
                marca: 'Adidas',
                sku: 'AD-UB22-001'
            }
        };
        
        return productos[productoId] || null;
    }

    validarStock(producto, talla, cantidad) {
        // En una implementación real, verificar stock específico por talla
        return cantidad <= producto.stock;
    }

    mostrarSeleccionTalla(productoId, cantidad, opciones) {
        const producto = this.obtenerInformacionProducto(productoId);
        if (!producto || !producto.tallasDisponibles) return;
        
        const tallasHTML = producto.tallasDisponibles.map(talla => `
            <button class="btn-talla" 
                    onclick="carritoSystem.seleccionarTalla(${productoId}, ${talla}, ${cantidad}, ${JSON.stringify(opciones).replace(/"/g, '&quot;')})">
                Talla ${talla}
            </button>
        `).join('');
        
        const popupHTML = `
            <div class="popup" id="popup-talla" style="display: flex;">
                <div class="popup-content">
                    <button class="popup-close" onclick="carritoSystem.cerrarPopupTalla()">×</button>
                    <div class="popup-header">
                        <h3>Selecciona tu talla</h3>
                        <p>${producto.nombre}</p>
                    </div>
                    <div class="tallas-container">
                        ${tallasHTML}
                    </div>
                    <div class="popup-actions">
                        <button class="btn btn-outline" onclick="carritoSystem.cerrarPopupTalla()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Crear o actualizar popup de tallas
        let popupTalla = document.getElementById('popup-talla');
        if (!popupTalla) {
            document.body.insertAdjacentHTML('beforeend', popupHTML);
        } else {
            popupTalla.innerHTML = popupHTML;
        }
    }

    seleccionarTalla(productoId, talla, cantidad, opciones) {
        this.cerrarPopupTalla();
        this.agregarProducto(productoId, talla, cantidad, opciones);
    }

    cerrarPopupTalla() {
        const popup = document.getElementById('popup-talla');
        if (popup) {
            popup.remove();
        }
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        // Usar el sistema de mensajes de auth o implementar uno específico
        authSystem.showToast(mensaje, tipo);
    }

    // Métodos públicos para otros módulos
    obtenerResumen() {
        return {
            totalItems: this.obtenerTotalProductos(),
            subtotal: this.state.subtotal,
            envio: this.state.envio,
            total: this.state.total,
            items: this.state.items,
            tieneEnvioGratis: this.state.subtotal >= this.state.envioGratis
        };
    }

    getItems() {
        return [...this.state.items]; // Copia para evitar mutaciones
    }

    getTotal() {
        return this.state.total;
    }

    estaVacio() {
        return this.state.items.length === 0;
    }
}

// Instancia global del sistema del carrito
const carritoSystem = new CarritoSystem();

// Funciones globales para compatibilidad
function mostrarCarrito() {
    carritoSystem.mostrarCarrito();
}

function agregarAlCarrito(productoId, talla = null, cantidad = 1) {
    return carritoSystem.agregarProducto(productoId, talla, cantidad);
}

function actualizarContadorCarrito() {
    carritoSystem.actualizarContadorHeader();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = carritoSystem;
}