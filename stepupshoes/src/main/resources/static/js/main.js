// Funciones generales de la aplicación

// Abrir popup de detalles del producto
function abrirDetalleProducto(productoId) {
    fetch(`/productos/${productoId}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('popup-detalle-content').innerHTML = html;
            document.getElementById('popup-detalle').style.display = 'flex';
        })
        .catch(error => console.error('Error:', error));
}

// Cerrar popups
function cerrarPopUp(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// Mostrar login popup
function mostrarLogin() {
    document.getElementById('popup-login').style.display = 'flex';
}

// Mostrar registro popup
function mostrarRegistro() {
    document.getElementById('popup-registro').style.display = 'flex';
}

// Cambiar entre login y registro
function cambiarFormulario(tipo) {
    if (tipo === 'login') {
        document.getElementById('popup-registro').style.display = 'none';
        document.getElementById('popup-login').style.display = 'flex';
    } else {
        document.getElementById('popup-login').style.display = 'none';
        document.getElementById('popup-registro').style.display = 'flex';
    }
}

// Cerrar popup al hacer click fuera
window.onclick = function(event) {
    const popups = document.querySelectorAll('.popup');
    popups.forEach(popup => {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });
}

// Manejar tecla ESC para cerrar popups
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const popups = document.querySelectorAll('.popup');
        popups.forEach(popup => {
            popup.style.display = 'none';
        });
    }
});

// Inicializar contador del carrito
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    document.getElementById('carrito-count').textContent = carrito.length;
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarContadorCarrito();
});