// ================================
// AGREGAR PRODUCTO AL CARRITO
// ================================
function agregarAlCarrito(productoId) {

    // valor por defecto
    const talla = 40;
    const cantidad = 1;

    fetch("/carrito/agregar", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `productoId=${productoId}&talla=${talla}&cantidad=${cantidad}`
    })
    .then(r => r.json())
    .then(data => {

        if (!data.success) {
            alert(data.message);
            if (data.message.includes("iniciar sesión")) {
                window.location.href = "/auth/login";
            }
            return;
        }

        // ACTUALIZAR CONTADOR CARRITO
        if (document.getElementById("carritoCountDesktop")) {
            document.getElementById("carritoCountDesktop").innerText = data.carritoCount;
        }

        if (document.getElementById("carrito-count-mobile")) {
            document.getElementById("carrito-count-mobile").innerText = data.carritoCount;
        }

        alert("Producto agregado al carrito ✔");
    })
    .catch(err => console.error(err));
}


// ================================
// ACTUALIZAR CANTIDAD
// ================================
function actualizarCantidad(index, cambio) {
    fetch("/carrito/actualizar?index=" + index + "&cambio=" + cambio, {
        method: "POST"
    })
    .then(r => r.json())
    .then(() => location.reload());
}

// ================================
// ELIMINAR PRODUCTO
// ================================
function eliminar(index) {
    fetch("/carrito/eliminar?index=" + index, {
        method: "POST"
    })
    .then(r => r.json())
    .then(() => location.reload());
}
