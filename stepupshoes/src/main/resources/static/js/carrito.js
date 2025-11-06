/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Other/javascript.js to edit this template
 */
// static/js/carrito.js - Manejo del carrito de compras

/**
 * Sistema completo del carrito de compras
 * Maneja agregar, eliminar, modificar cantidades y calcular totales
 */

// Estado del carrito
let carritoState = {
    items: [],
    subtotal: 0,
    envio: 0,
    total: 0,
    envioGratis: 100 // Monto mínimo para envío gratis
};

// Inicializar carrito
function initCarrito() {
    console.log('Inicializando sistema del carrito...');
    
    // Cargar carrito desde localStorage
    cargarCarritoDesdeStorage();
    
    // Actualizar UI
    actualizarUICarrito();
    
    // Configurar event listeners
    setupCarritoEventListeners();
}

// Cargar carrito desde localStorage
function cargarCarritoDesdeStorage() {
    const carritoGuardado = localStorage.getItem('carritoStepUp');
    
    if (carritoGuardado) {
        try {
            const carritoData = JSON.parse(carritoGuardado);
            carritoState.items = carritoData.items || [];
            console.log('Carrito cargado desde storage:', carritoState.items);
        } catch (error) {
            console.error('Error cargando carrito desde storage:', error);
            carritoState.items = [];
        }
    }
    
    calcularTotales();
}

// Guardar carrito en localStorage
function guardarCarritoEnStorage() {
    try {
        localStorage.setItem('carritoStepUp', JSON.stringify({
            items: carritoState.items,
            timestamp: new Date().toISOString()
        }));
        console.log('Carrito guardado en storage');
    } catch (error) {
        console.error('Error guardando carrito en storage:', error);
    }
}

// Configurar event listeners del carrito
function setupCarritoEventListeners() {
    // Event listener para el documento (eventos delegados)
    document.addEventListener('click', function(event) {
        // Eliminar item
        if (event.target.closest('.carrito-item-eliminar')) {
            const itemId = event.target.closest('.carrito-item-eliminar').dataset.itemId;
            eliminarDelCarrito(itemId);
        }
        
        // Disminuir cantidad
        if (event.target.closest('.cantidad-decrementar')) {
            const itemId = event.target.closest('.cantidad-decrementar').dataset.itemId;
            modificarCantidad(itemId, -1);
        }
        
        // Aumentar cantidad
        if (event.target.closest('.cantidad-incrementar')) {
            const itemId = event.target.closest('.cantidad-incrementar').dataset.itemId;
            modificarCantidad(itemId, 1);
        }
    });
}

// Agregar producto al carrito
function agregarAlCarrito(productoId, talla = null, cantidad = 1) {
    console.log('Agregando al carrito:', productoId, talla, cantidad);
    
    // Verificar si el usuario está autenticado
    if (!verificarAutenticacionParaCarrito()) {
        return false;
    }
    
    // Obtener información del producto (simulado - reemplazar con fetch real)
    const producto = obtenerInformacionProducto(productoId);
    
    if (!producto) {
        mostrarMensajeCarrito('Error: Producto no encontrado', 'error');
        return false;
    }
    
    // Validar talla
    if (talla === null) {
        // Si no se especifica talla, abrir popup de selección
        abrirSeleccionTalla(productoId, cantidad);
        return false;
    }
    
    // Validar stock
    if (!validarStock(producto, talla, cantidad)) {
        mostrarMensajeCarrito('Stock insuficiente para este producto', 'error');
        return false;
    }
    
    // Crear item del carrito
    const itemCarrito = {
        id: generarIdItem(),
        productoId: productoId,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagenUrl,
        talla: talla,
        cantidad: cantidad,
        stock: producto.stock,
        maxPorPedido: producto.maxPorPedido || 5
    };
    
    // Verificar si ya existe el mismo producto con misma talla
    const itemExistente = carritoState.items.find(item => 
        item.productoId === productoId && item.talla === talla
    );
    
    if (itemExistente) {
        // Actualizar cantidad existente
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        
        if (nuevaCantidad > itemExistente.maxPorPedido) {
            mostrarMensajeCarrito(`Máximo ${itemExistente.maxPorPedido} unidades por pedido`, 'error');
            return false;
        }
        
        if (nuevaCantidad > itemExistente.stock) {
            mostrarMensajeCarrito('Stock insuficiente', 'error');
            return false;
        }
        
        itemExistente.cantidad = nuevaCantidad;
    } else {
        // Agregar nuevo item
        carritoState.items.push(itemCarrito);
    }
    
    // Actualizar cálculos y UI
    calcularTotales();
    guardarCarritoEnStorage();
    actualizarUICarrito();
    
    // Mostrar mensaje de éxito
    mostrarMensajeCarrito('Producto agregado al carrito', 'success');
    
    // Mostrar carrito automáticamente
    setTimeout(() => {
        mostrarCarrito();
    }, 1000);
    
    return true;
}

// Eliminar item del carrito
function eliminarDelCarrito(itemId) {
    console.log('Eliminando del carrito:', itemId);
    
    carritoState.items = carritoState.items.filter(item => item.id !== itemId);
    
    // Actualizar cálculos y UI
    calcularTotales();
    guardarCarritoEnStorage();
    actualizarUICarrito();
    
    mostrarMensajeCarrito('Producto eliminado del carrito', 'info');
}

// Modificar cantidad de un item
function modificarCantidad(itemId, cambio) {
    const item = carritoState.items.find(item => item.id === itemId);
    
    if (!item) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    
    // Validar límites
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(itemId);
        return;
    }
    
    if (nuevaCantidad > item.maxPorPedido) {
        mostrarMensajeCarrito(`Máximo ${item.maxPorPedido} unidades por pedido`, 'error');
        return;
    }
    
    if (nuevaCantidad > item.stock) {
        mostrarMensajeCarrito('Stock insuficiente', 'error');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    
    // Actualizar cálculos y UI
    calcularTotales();
    guardarCarritoEnStorage();
    actualizarUICarrito();
}

// Calcular totales del carrito
function calcularTotales() {
    // Subtotal
    carritoState.subtotal = carritoState.items.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
    
    // Envío (gratis sobre $100)
    carritoState.envio = carritoState.subtotal >= carritoState.envioGratis ? 0 : 10;
    
    // Total
    carritoState.total = carritoState.subtotal + carritoState.envio;
    
    console.log('Totales calculados:', carritoState);
}

// Actualizar UI del carrito
function actualizarUICarrito() {
    // Actualizar contador en el header
    const totalItems = carritoState.items.reduce((total, item) => total + item.cantidad, 0);
    document.getElementById('carrito-count').textContent = totalItems;
    
    // Actualizar popup del carrito si está abierto
    if (document.getElementById('popup-carrito').style.display === 'flex') {
        renderizarCarritoPopup();
    }
}

// Renderizar popup del carrito
function renderizarCarritoPopup() {
    const carritoContent = document.getElementById('carrito-content');
    
    if (!carritoContent) return;
    
    if (carritoState.items.length === 0) {
        // Carrito vacío
        carritoContent.innerHTML = `
            <div class="carrito-vacio">
                <div class="empty-icon">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos para empezar a comprar</p>
                <button class="btn btn-primary" onclick="cerrarPopUp('popup-carrito')">Continuar Comprando</button>
            </div>
        `;
    } else {
        // Carrito con items
        carritoContent.innerHTML = `
            <div class="carrito-items">
                ${carritoState.items.map(item => `
                    <div class="carrito-item" data-item-id="${item.id}">
                        <img src="${item.imagen}" alt="${item.nombre}" class="carrito-item-imagen">
                        <div class="carrito-item-info">
                            <div class="carrito-item-nombre">${item.nombre}</div>
                            <div class="carrito-item-detalles">
                                <span class="carrito-item-talla">Talla: ${item.talla}</span>
                                <span class="carrito-item-precio">$${item.precio.toFixed(2)} c/u</span>
                            </div>
                            <div class="${item.cantidad >= item.stock ? 'stock-bajo' : 'stock-disponible'}">
                                ${item.cantidad >= item.stock ? 'Stock limitado' : 'Stock disponible'}
                            </div>
                        </div>
                        <div class="carrito-item-cantidad">
                            <button class="cantidad-btn cantidad-decrementar" data-item-id="${item.id}" 
                                    ${item.cantidad <= 1 ? 'disabled' : ''}>-</button>
                            <span class="cantidad-value">${item.cantidad}</span>
                            <button class="cantidad-btn cantidad-incrementar" data-item-id="${item.id}"
                                    ${item.cantidad >= item.maxPorPedido ? 'disabled' : ''}>+</button>
                        </div>
                        <div class="carrito-item-total">
                            $${(item.precio * item.cantidad).toFixed(2)}
                        </div>
                        <button class="carrito-item-eliminar" data-item-id="${item.id}" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                `).join('')}
            </div>
            
            ${carritoState.subtotal < carritoState.envioGratis ? `
                <div class="carrito-promociones">
                    <h4>¡Envío gratis!</h4>
                    <p>Falta $${(carritoState.envioGratis - carritoState.subtotal).toFixed(2)} para obtener envío gratis</p>
                </div>
            ` : ''}
            
            <div class="carrito-resumen">
                <div class="resumen-linea">
                    <span>Subtotal:</span>
                    <span>$${carritoState.subtotal.toFixed(2)}</span>
                </div>
                <div class="resumen-linea">
                    <span>Envío:</span>
                    <span class="resumen-envio ${carritoState.envio === 0 ? 'gratis' : 'pago'}">
                        ${carritoState.envio === 0 ? 'GRATIS' : `$${carritoState.envio.toFixed(2)}`}
                    </span>
                </div>
                <div class="resumen-linea resumen-total">
                    <span>Total:</span>
                    <span>$${carritoState.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="carrito-actions">
                <button class="btn-carrito btn-carrito-continuar" onclick="cerrarPopUp('popup-carrito')">
                    ← Continuar Comprando
                </button>
                <button class="btn-carrito btn-carrito-finalizar" onclick="finalizarCompra()">
                    Finalizar Compra →
                </button>
            </div>
        `;
    }
}

// Mostrar popup del carrito
function mostrarCarrito() {
    console.log('Mostrando carrito...');
    
    // Renderizar contenido
    renderizarCarritoPopup();
    
    // Mostrar popup
    document.getElementById('popup-carrito').style.display = 'flex';
}

// Finalizar compra
function finalizarCompra() {
    console.log('Finalizando compra...');
    
    // Verificar autenticación
    if (!verificarAutenticacionParaCompra()) {
        return;
    }
    
    // Verificar que el carrito no esté vacío
    if (carritoState.items.length === 0) {
        mostrarMensajeCarrito('El carrito está vacío', 'error');
        return;
    }
    
    // Verificar stock de todos los items
    if (!verificarStockDisponible()) {
        mostrarMensajeCarrito('Algunos productos ya no tienen stock disponible', 'error');
        return;
    }
    
    // Redirigir al proceso de checkout
    window.location.href = '/checkout';
}

// Verificar autenticación para carrito
function verificarAutenticacionParaCarrito() {
    if (!authState.isAuthenticated) {
        mostrarMensajeCarrito('Debes iniciar sesión para agregar productos al carrito', 'error');
        mostrarLogin();
        return false;
    }
    return true;
}

// Verificar autenticación para compra
function verificarAutenticacionParaCompra() {
    if (!authState.isAuthenticated) {
        mostrarMensajeCarrito('Debes iniciar sesión para finalizar la compra', 'error');
        mostrarLogin();
        return false;
    }
    return true;
}

// Verificar stock disponible
function verificarStockDisponible() {
    // Simular verificación de stock (reemplazar con verificación real)
    return carritoState.items.every(item => item.cantidad <= item.stock);
}

// Mostrar mensajes del carrito
function mostrarMensajeCarrito(mensaje, tipo = 'info') {
    // Crear elemento de mensaje
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `carrito-mensaje carrito-mensaje-${tipo}`;
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
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (mensajeElement.parentElement) {
            mensajeElement.remove();
        }
    }, 3000);
}

// Generar ID único para items del carrito
function generarIdItem() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Obtener información del producto (simulado - reemplazar con fetch real)
function obtenerInformacionProducto(productoId) {
    // Simular datos de productos (reemplazar con API real)
    const productos = {
        1: {
            id: 1,
            nombre: 'Nike Air Max 270',
            precio: 129.99,
            imagenUrl: '/images/nike-air-max.jpg',
            stock: 25,
            maxPorPedido: 5,
            tallasDisponibles: [38, 39, 40, 41, 42]
        },
        2: {
            id: 2,
            nombre: 'Adidas Stan Smith',
            precio: 89.99,
            imagenUrl: '/images/adidas-stan-smith.jpg',
            stock: 30,
            maxPorPedido: 5,
            tallasDisponibles: [37, 38, 39, 40, 41]
        }
        // Agregar más productos según sea necesario
    };
    
    return productos[productoId] || null;
}

// Abrir selección de talla (popup adicional)
function abrirSeleccionTalla(productoId, cantidad) {
    const producto = obtenerInformacionProducto(productoId);
    
    if (!producto) return;
    
    const tallasHTML = producto.tallasDisponibles.map(talla => `
        <button class="btn-talla" onclick="seleccionarTalla(${productoId}, ${talla}, ${cantidad})">
            Talla ${talla}
        </button>
    `).join('');
    
    const popupContent = `
        <div class="popup-content">
            <button class="popup-close" onclick="cerrarPopUp('popup-talla')">&times;</button>
            <div class="auth-header">
                <h2>Selecciona tu talla</h2>
                <p>${producto.nombre}</p>
            </div>
            <div class="tallas-container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 2rem 0;">
                ${tallasHTML}
            </div>
            <button class="btn btn-outline" onclick="cerrarPopUp('popup-talla')">Cancelar</button>
        </div>
    `;
    
    // Crear popup temporal para selección de talla
    let popupTalla = document.getElementById('popup-talla');
    if (!popupTalla) {
        popupTalla = document.createElement('div');
        popupTalla.id = 'popup-talla';
        popupTalla.className = 'popup';
        document.body.appendChild(popupTalla);
    }
    
    popupTalla.innerHTML = popupContent;
    popupTalla.style.display = 'flex';
}

// Seleccionar talla y agregar al carrito
function seleccionarTalla(productoId, talla, cantidad) {
    cerrarPopUp('popup-talla');
    agregarAlCarrito(productoId, talla, cantidad);
}

// Vaciar carrito completamente
function vaciarCarrito() {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        carritoState.items = [];
        calcularTotales();
        guardarCarritoEnStorage();
        actualizarUICarrito();
        mostrarMensajeCarrito('Carrito vaciado', 'info');
    }
}

// Obtener resumen del carrito para otras partes de la aplicación
function obtenerResumenCarrito() {
    return {
        totalItems: carritoState.items.reduce((total, item) => total + item.cantidad, 0),
        subtotal: carritoState.subtotal,
        envio: carritoState.envio,
        total: carritoState.total,
        items: carritoState.items
    };
}

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    initCarrito();
});

