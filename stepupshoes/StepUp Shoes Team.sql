-- =============================================
-- MEJORAS Y AMPLIACIONES PARA STEPUP_SHOES
-- =============================================

-- Usar la base de datos existente
USE stepup_shoes;

-- =============================================
-- NUEVAS TABLAS PARA FUNCIONALIDADES AVANZADAS
-- =============================================

-- Tabla: producto_imagenes (Imágenes múltiples por producto)
CREATE TABLE IF NOT EXISTS producto_imagenes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    imagen_url VARCHAR(500) NOT NULL,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_imagen_principal (producto_id, es_principal),
    INDEX idx_producto_imagenes_orden (producto_id, orden),
    INDEX idx_imagenes_principal (es_principal)
);

-- Tabla: historial_precios (Seguimiento de cambios de precio)
CREATE TABLE IF NOT EXISTS historial_precios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    precio_anterior DECIMAL(10,2),
    precio_nuevo DECIMAL(10,2) NOT NULL,
    tipo_cambio ENUM('ACTUALIZACION', 'PROMOCION', 'REBAJA', 'AUMENTO') DEFAULT 'ACTUALIZACION',
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_cambio VARCHAR(100),
    motivo TEXT,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_historial_producto (producto_id),
    INDEX idx_historial_fecha (fecha_cambio),
    INDEX idx_historial_tipo (tipo_cambio)
);

-- Tabla: cupones (Sistema de cupones de descuento)
CREATE TABLE IF NOT EXISTS cupones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    tipo ENUM('PORCENTAJE', 'MONTO_FIJO', 'ENVIO_GRATIS') NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    max_descuento DECIMAL(10,2),
    min_compra DECIMAL(10,2) DEFAULT 0,
    usos_maximos INT,
    usos_actuales INT DEFAULT 0,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    solo_primer_pedido BOOLEAN DEFAULT FALSE,
    productos_aplicables JSON, -- NULL para todos, o array de product_ids
    categorias_aplicables JSON, -- NULL para todas, o array de categoria_ids
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cupones_activo (activo),
    INDEX idx_cupones_fechas (fecha_inicio, fecha_fin),
    INDEX idx_cupones_codigo (codigo),
    INDEX idx_cupones_tipo (tipo)
);

-- Tabla: cupones_usados (Registro de cupones utilizados)
CREATE TABLE IF NOT EXISTS cupones_usados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cupon_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    pedido_id BIGINT NOT NULL,
    descuento_aplicado DECIMAL(10,2) NOT NULL,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cupon_pedido (cupon_id, pedido_id),
    INDEX idx_cupones_usados_usuario (usuario_id),
    INDEX idx_cupones_usados_fecha (fecha_uso)
);

-- Tabla: wishlist (Lista de deseos de usuarios)
CREATE TABLE IF NOT EXISTS wishlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wishlist_usuario_producto (usuario_id, producto_id),
    INDEX idx_wishlist_usuario (usuario_id),
    INDEX idx_wishlist_fecha (fecha_agregado)
);

-- Tabla: notificaciones (Sistema de notificaciones)
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('PEDIDO', 'PROMOCION', 'SISTEMA', 'STOCK', 'SEGURIDAD') NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    url_accion VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_leida TIMESTAMP NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_notificaciones_usuario (usuario_id),
    INDEX idx_notificaciones_leida (leida),
    INDEX idx_notificaciones_tipo (tipo),
    INDEX idx_notificaciones_fecha (fecha_creacion)
);

-- Tabla: inventario_movimientos (Control detallado de inventario)
CREATE TABLE IF NOT EXISTS inventario_movimientos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    talla INT NOT NULL CHECK (talla BETWEEN 35 AND 50),
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia VARCHAR(100), -- pedido_id, ajuste_id, etc.
    motivo VARCHAR(200),
    usuario_id BIGINT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_inventario_producto (producto_id),
    INDEX idx_inventario_fecha (fecha_movimiento),
    INDEX idx_inventario_tipo (tipo_movimiento),
    INDEX idx_inventario_referencia (referencia)
);

-- Tabla: pagos (Información detallada de pagos)
CREATE TABLE IF NOT EXISTS pagos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    metodo_pago ENUM('TARJETA', 'PAYPAL', 'TRANSFERENCIA', 'EFECTIVO') NOT NULL,
    estado ENUM('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO', 'CANCELADO') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    transaccion_id VARCHAR(100) UNIQUE,
    datos_transaccion JSON, -- Respuesta completa del gateway de pago
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pagos_pedido (pedido_id),
    INDEX idx_pagos_estado (estado),
    INDEX idx_pagos_transaccion (transaccion_id),
    INDEX idx_pagos_fecha (fecha_creacion)
);

-- Tabla: envios (Seguimiento detallado de envíos)
CREATE TABLE IF NOT EXISTS envios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    metodo_envio VARCHAR(50) NOT NULL,
    costo_envio DECIMAL(10,2) NOT NULL,
    transportista VARCHAR(100),
    numero_guia VARCHAR(100),
    url_seguimiento VARCHAR(500),
    estado ENUM('PREPARACION', 'ENVIADO', 'EN_TRANSITO', 'ENTREGADO', 'DEVUELTO') NOT NULL,
    fecha_estimada_entrega DATE,
    fecha_envio TIMESTAMP NULL,
    fecha_entrega TIMESTAMP NULL,
    direccion_envio JSON, -- Almacena toda la dirección en formato JSON
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_envio_pedido (pedido_id),
    INDEX idx_envios_estado (estado),
    INDEX idx_envios_fecha_estimada (fecha_estimada_entrega),
    INDEX idx_envios_guia (numero_guia)
);

-- =============================================
-- MODIFICACIONES A TABLAS EXISTENTES
-- =============================================

-- Agregar columna para cupones en pedidos
ALTER TABLE pedidos 
ADD COLUMN cupon_id BIGINT NULL AFTER metodo_envio,
ADD COLUMN descuento_cupon DECIMAL(10,2) DEFAULT 0 AFTER cupon_id,
ADD CONSTRAINT fk_pedido_cupon 
    FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE SET NULL;

-- Agregar columna para valoraciones promedio en productos
ALTER TABLE productos 
ADD COLUMN valoracion_promedio DECIMAL(3,2) DEFAULT 0.00 AFTER stock,
ADD COLUMN total_valoraciones INT DEFAULT 0 AFTER valoracion_promedio,
ADD INDEX idx_productos_valoracion (valoracion_promedio);

-- Agregar columna para productos relacionados
ALTER TABLE productos 
ADD COLUMN productos_relacionados JSON AFTER total_valoraciones;

-- Agregar columna para metadatos SEO
ALTER TABLE productos 
ADD COLUMN meta_titulo VARCHAR(200) AFTER productos_relacionados,
ADD COLUMN meta_descripcion TEXT AFTER meta_titulo,
ADD COLUMN slug VARCHAR(200) UNIQUE AFTER meta_descripcion;

ALTER TABLE categorias 
ADD COLUMN meta_titulo VARCHAR(200) AFTER activo,
ADD COLUMN meta_descripcion TEXT AFTER meta_titulo,
ADD COLUMN slug VARCHAR(100) UNIQUE AFTER meta_descripcion;

-- Agregar columna para peso y dimensiones de productos
ALTER TABLE productos 
ADD COLUMN peso_kg DECIMAL(5,2) AFTER slug,
ADD COLUMN largo_cm DECIMAL(5,2) AFTER peso_kg,
ADD COLUMN ancho_cm DECIMAL(5,2) AFTER largo_cm,
ADD COLUMN alto_cm DECIMAL(5,2) AFTER ancho_cm;

-- =============================================
-- NUEVAS VISTAS
-- =============================================

-- Vista: productos con imágenes múltiples
CREATE OR REPLACE VIEW vista_productos_completa AS
SELECT 
    p.*,
    c.nombre as categoria_nombre,
    c.slug as categoria_slug,
    GROUP_CONCAT(DISTINCT pt.talla ORDER BY pt.talla) as tallas_disponibles,
    GROUP_CONCAT(DISTINCT pi.imagen_url ORDER BY pi.orden, pi.es_principal DESC) as imagenes,
    (SELECT imagen_url FROM producto_imagenes WHERE producto_id = p.id AND es_principal = TRUE LIMIT 1) as imagen_principal,
    COUNT(DISTINCT r.id) as total_resenas,
    p.valoracion_promedio
FROM productos p
INNER JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN producto_tallas pt ON p.id = pt.producto_id AND pt.stock > 0
LEFT JOIN producto_imagenes pi ON p.id = pi.producto_id
LEFT JOIN reseñas r ON p.id = r.producto_id AND r.activo = TRUE AND r.aprobado = TRUE
WHERE p.activo = TRUE AND c.activo = TRUE
GROUP BY p.id, c.nombre, c.slug;

-- Vista: carrito con información completa
CREATE OR REPLACE VIEW vista_carrito_completo AS
SELECT 
    c.id,
    c.usuario_id,
    c.producto_id,
    c.talla,
    c.cantidad,
    c.fecha_agregado,
    p.nombre as producto_nombre,
    p.precio as producto_precio,
    p.precio_original as producto_precio_original,
    p.imagen_url as producto_imagen,
    p.stock as producto_stock,
    p.peso_kg as producto_peso,
    pt.stock as talla_stock,
    (p.precio * c.cantidad) as subtotal,
    CASE 
        WHEN p.precio_original IS NOT NULL THEN (p.precio_original - p.precio) * c.cantidad
        ELSE 0
    END as ahorro_total,
    c.cantidad <= pt.stock as stock_suficiente
FROM carrito_compras c
INNER JOIN productos p ON c.producto_id = p.id
LEFT JOIN producto_tallas pt ON c.producto_id = pt.producto_id AND c.talla = pt.talla
WHERE p.activo = TRUE;

-- Vista: pedidos con información extendida
CREATE OR REPLACE VIEW vista_pedidos_completa AS
SELECT 
    p.id,
    p.numero_pedido,
    p.usuario_id,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    p.total,
    p.subtotal,
    p.envio,
    p.descuento_cupon,
    p.estado,
    p.metodo_pago,
    p.metodo_envio,
    p.estado_pago,
    c.codigo as cupon_codigo,
    e.numero_guia,
    e.estado as estado_envio,
    e.fecha_estimada_entrega,
    p.fecha_creacion,
    p.fecha_confirmacion,
    p.fecha_envio,
    p.fecha_entrega,
    COUNT(DISTINCT d.id) as total_items,
    SUM(d.cantidad) as total_productos,
    DATEDIFF(COALESCE(p.fecha_entrega, NOW()), p.fecha_creacion) as dias_entrega
FROM pedidos p
INNER JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN detalles_pedido d ON p.id = d.pedido_id
LEFT JOIN cupones c ON p.cupon_id = c.id
LEFT JOIN envios e ON p.id = e.pedido_id
GROUP BY p.id, p.numero_pedido, p.usuario_id, u.nombre, u.email, p.total, p.subtotal, p.envio, 
         p.descuento_cupon, p.estado, p.metodo_pago, p.metodo_envio, p.estado_pago, c.codigo,
         e.numero_guia, e.estado, e.fecha_estimada_entrega, p.fecha_creacion, p.fecha_confirmacion,
         p.fecha_envio, p.fecha_entrega;

-- Vista: análisis de ventas
CREATE OR REPLACE VIEW vista_analisis_ventas AS
SELECT 
    DATE(p.fecha_creacion) as fecha,
    COUNT(*) as total_pedidos,
    SUM(p.total) as total_ventas,
    AVG(p.total) as promedio_venta,
    COUNT(DISTINCT p.usuario_id) as clientes_unicos,
    SUM(d.cantidad) as total_productos_vendidos,
    SUM(CASE WHEN p.estado = 'ENTREGADO' THEN 1 ELSE 0 END) as pedidos_entregados,
    SUM(CASE WHEN p.estado = 'CANCELADO' THEN 1 ELSE 0 END) as pedidos_cancelados
FROM pedidos p
LEFT JOIN detalles_pedido d ON p.id = d.pedido_id
GROUP BY DATE(p.fecha_creacion);

-- Vista: productos más vendidos
CREATE OR REPLACE VIEW vista_productos_populares AS
SELECT 
    p.id,
    p.nombre,
    p.precio,
    p.imagen_url,
    c.nombre as categoria_nombre,
    SUM(d.cantidad) as total_vendido,
    COUNT(DISTINCT d.pedido_id) as total_pedidos,
    AVG(r.calificacion) as valoracion_promedio,
    COUNT(DISTINCT r.id) as total_resenas,
    p.stock
FROM productos p
INNER JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN detalles_pedido d ON p.id = d.producto_id
LEFT JOIN reseñas r ON p.id = r.producto_id AND r.activo = TRUE AND r.aprobado = TRUE
WHERE p.activo = TRUE
GROUP BY p.id, p.nombre, p.precio, p.imagen_url, c.nombre, p.stock
ORDER BY total_vendido DESC;

-- =============================================
-- NUEVOS PROCEDIMIENTOS ALMACENADOS
-- =============================================

DELIMITER //

-- Procedimiento: Aplicar cupón a un pedido
CREATE PROCEDURE sp_aplicar_cupon(
    IN p_pedido_id BIGINT,
    IN p_codigo_cupon VARCHAR(50),
    OUT p_descuento DECIMAL(10,2),
    OUT p_mensaje VARCHAR(200)
)
BEGIN
    DECLARE v_cupon_id BIGINT;
    DECLARE v_tipo_cupon ENUM('PORCENTAJE', 'MONTO_FIJO', 'ENVIO_GRATIS');
    DECLARE v_valor_cupon DECIMAL(10,2);
    DECLARE v_max_descuento DECIMAL(10,2);
    DECLARE v_min_compra DECIMAL(10,2);
    DECLARE v_usos_maximos INT;
    DECLARE v_usos_actuales INT;
    DECLARE v_subtotal_pedido DECIMAL(10,2);
    DECLARE v_envio_pedido DECIMAL(10,2);
    DECLARE v_usuario_id BIGINT;
    DECLARE v_es_primer_pedido BOOLEAN;
    
    -- Obtener información del cupón
    SELECT id, tipo, valor, max_descuento, min_compra, usos_maximos, usos_actuales, solo_primer_pedido
    INTO v_cupon_id, v_tipo_cupon, v_valor_cupon, v_max_descuento, v_min_compra, v_usos_maximos, v_usos_actuales, v_es_primer_pedido
    FROM cupones 
    WHERE codigo = p_codigo_cupon 
    AND activo = TRUE 
    AND fecha_inicio <= NOW() 
    AND fecha_fin >= NOW();
    
    -- Obtener información del pedido
    SELECT subtotal, envio, usuario_id 
    INTO v_subtotal_pedido, v_envio_pedido, v_usuario_id
    FROM pedidos 
    WHERE id = p_pedido_id;
    
    -- Validaciones
    IF v_cupon_id IS NULL THEN
        SET p_descuento = 0;
        SET p_mensaje = 'Cupón no válido o expirado';
    ELSEIF v_usos_maximos IS NOT NULL AND v_usos_actuales >= v_usos_maximos THEN
        SET p_descuento = 0;
        SET p_mensaje = 'Cupón ya no está disponible';
    ELSEIF v_min_compra > v_subtotal_pedido THEN
        SET p_descuento = 0;
        SET p_mensaje = CONCAT('Mínimo de compra: $', v_min_compra);
    ELSEIF v_es_primer_pedido AND EXISTS(SELECT 1 FROM pedidos WHERE usuario_id = v_usuario_id AND id != p_pedido_id) THEN
        SET p_descuento = 0;
        SET p_mensaje = 'Cupón solo válido para primer pedido';
    ELSE
        -- Calcular descuento según tipo
        CASE v_tipo_cupon
            WHEN 'PORCENTAJE' THEN
                SET p_descuento = (v_subtotal_pedido * v_valor_cupon) / 100;
                IF v_max_descuento IS NOT NULL AND p_descuento > v_max_descuento THEN
                    SET p_descuento = v_max_descuento;
                END IF;
            WHEN 'MONTO_FIJO' THEN
                SET p_descuento = LEAST(v_valor_cupon, v_subtotal_pedido);
            WHEN 'ENVIO_GRATIS' THEN
                SET p_descuento = v_envio_pedido;
            ELSE
                SET p_descuento = 0;
        END CASE;
        
        -- Actualizar pedido
        UPDATE pedidos 
        SET cupon_id = v_cupon_id, 
            descuento_cupon = p_descuento,
            total = subtotal + envio - p_descuento
        WHERE id = p_pedido_id;
        
        -- Incrementar usos del cupón
        UPDATE cupones 
        SET usos_actuales = usos_actuales + 1 
        WHERE id = v_cupon_id;
        
        SET p_mensaje = 'Cupón aplicado correctamente';
    END IF;
END //

-- Procedimiento: Actualizar valoraciones de producto
CREATE PROCEDURE sp_actualizar_valoraciones_producto(IN p_producto_id BIGINT)
BEGIN
    DECLARE v_promedio DECIMAL(3,2);
    DECLARE v_total INT;
    
    SELECT AVG(calificacion), COUNT(*)
    INTO v_promedio, v_total
    FROM reseñas 
    WHERE producto_id = p_producto_id 
    AND activo = TRUE 
    AND aprobado = TRUE;
    
    UPDATE productos 
    SET valoracion_promedio = COALESCE(v_promedio, 0),
        total_valoraciones = COALESCE(v_total, 0)
    WHERE id = p_producto_id;
END //

-- Procedimiento: Generar reporte de inventario
CREATE PROCEDURE sp_reporte_inventario(IN p_categoria_id BIGINT)
BEGIN
    SELECT 
        p.id,
        p.nombre,
        c.nombre as categoria,
        p.stock as stock_total,
        GROUP_CONCAT(CONCAT(pt.talla, ':', pt.stock) ORDER BY pt.talla) as stock_por_talla,
        SUM(pt.stock) as stock_tallas,
        COUNT(DISTINCT pt.talla) as tallas_disponibles,
        p.precio,
        CASE 
            WHEN p.stock = 0 THEN 'AGOTADO'
            WHEN p.stock <= 5 THEN 'STOCK_BAJO'
            ELSE 'STOCK_NORMAL'
        END as estado_stock
    FROM productos p
    INNER JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN producto_tallas pt ON p.id = pt.producto_id
    WHERE p.activo = TRUE
    AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
    GROUP BY p.id, p.nombre, c.nombre, p.stock, p.precio
    ORDER BY p.stock ASC, p.nombre ASC;
END //

-- Procedimiento: Procesar reabastecimiento de inventario
CREATE PROCEDURE sp_procesar_reabastecimiento(
    IN p_producto_id BIGINT,
    IN p_talla INT,
    IN p_cantidad INT,
    IN p_usuario_id BIGINT,
    IN p_motivo VARCHAR(200)
)
BEGIN
    DECLARE v_stock_actual INT;
    DECLARE v_nuevo_stock INT;
    
    -- Obtener stock actual
    SELECT stock INTO v_stock_actual
    FROM producto_tallas
    WHERE producto_id = p_producto_id AND talla = p_talla;
    
    -- Si no existe, crear registro
    IF v_stock_actual IS NULL THEN
        INSERT INTO producto_tallas (producto_id, talla, stock)
        VALUES (p_producto_id, p_talla, p_cantidad);
        SET v_stock_actual = 0;
        SET v_nuevo_stock = p_cantidad;
    ELSE
        -- Actualizar stock
        UPDATE producto_tallas 
        SET stock = stock + p_cantidad
        WHERE producto_id = p_producto_id AND talla = p_talla;
        SET v_nuevo_stock = v_stock_actual + p_cantidad;
    END IF;
    
    -- Registrar movimiento de inventario
    INSERT INTO inventario_movimientos (
        producto_id, talla, tipo_movimiento, cantidad, 
        stock_anterior, stock_nuevo, usuario_id, motivo
    ) VALUES (
        p_producto_id, p_talla, 'ENTRADA', p_cantidad,
        v_stock_actual, v_nuevo_stock, p_usuario_id, p_motivo
    );
    
    -- Actualizar stock general del producto
    UPDATE productos 
    SET stock = (
        SELECT SUM(stock) 
        FROM producto_tallas 
        WHERE producto_id = p_producto_id
    ) 
    WHERE id = p_producto_id;
END //

-- Procedimiento: Obtener productos recomendados
CREATE PROCEDURE sp_obtener_recomendaciones(
    IN p_usuario_id BIGINT,
    IN p_producto_id BIGINT,
    IN p_limite INT
)
BEGIN
    -- Recomendaciones basadas en categoría y productos similares
    SELECT DISTINCT p.*
    FROM productos p
    WHERE p.id != p_producto_id
    AND p.activo = TRUE
    AND (
        p.categoria_id = (SELECT categoria_id FROM productos WHERE id = p_producto_id)
        OR p.id IN (
            SELECT producto_id 
            FROM detalles_pedido 
            WHERE pedido_id IN (
                SELECT pedido_id 
                FROM detalles_pedido 
                WHERE producto_id = p_producto_id
            )
            AND producto_id != p_producto_id
        )
    )
    ORDER BY p.destacado DESC, p.valoracion_promedio DESC, p.fecha_creacion DESC
    LIMIT p_limite;
END //

DELIMITER ;

-- =============================================
-- NUEVOS TRIGGERS
-- =============================================

DELIMITER //

-- Trigger: Actualizar valoraciones cuando se modifica una reseña
CREATE TRIGGER tr_resena_actualizar_valoraciones 
AFTER INSERT ON reseñas 
FOR EACH ROW 
BEGIN
    CALL sp_actualizar_valoraciones_producto(NEW.producto_id);
END //

CREATE TRIGGER tr_resena_actualizar_valoraciones_update 
AFTER UPDATE ON reseñas 
FOR EACH ROW 
BEGIN
    IF OLD.calificacion != NEW.calificacion OR OLD.activo != NEW.activo OR OLD.aprobado != NEW.aprobado THEN
        CALL sp_actualizar_valoraciones_producto(NEW.producto_id);
    END IF;
END //

CREATE TRIGGER tr_resena_actualizar_valoraciones_delete 
AFTER DELETE ON reseñas 
FOR EACH ROW 
BEGIN
    CALL sp_actualizar_valoraciones_producto(OLD.producto_id);
END //

-- Trigger: Registrar historial de precios
CREATE TRIGGER tr_producto_historial_precios 
BEFORE UPDATE ON productos 
FOR EACH ROW 
BEGIN
    IF OLD.precio != NEW.precio THEN
        INSERT INTO historial_precios (
            producto_id, precio_anterior, precio_nuevo, tipo_cambio
        ) VALUES (
            NEW.id, OLD.precio, NEW.precio, 'ACTUALIZACION'
        );
    END IF;
END //

-- Trigger: Validar stock antes de actualizar carrito
CREATE TRIGGER tr_carrito_actualizar_validar_stock 
BEFORE UPDATE ON carrito_compras 
FOR EACH ROW 
BEGIN
    DECLARE v_stock_disponible INT;
    
    IF NEW.cantidad != OLD.cantidad THEN
        SELECT stock INTO v_stock_disponible 
        FROM producto_tallas 
        WHERE producto_id = NEW.producto_id AND talla = NEW.talla;
        
        IF v_stock_disponible IS NULL OR v_stock_disponible < NEW.cantidad THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Stock insuficiente para actualizar la cantidad';
        END IF;
    END IF;
END //

-- Trigger: Crear notificación para nuevo pedido
CREATE TRIGGER tr_pedido_crear_notificacion 
AFTER INSERT ON pedidos 
FOR EACH ROW 
BEGIN
    INSERT INTO notificaciones (
        usuario_id, titulo, mensaje, tipo, url_accion
    ) VALUES (
        NEW.usuario_id,
        '¡Pedido Confirmado!',
        CONCAT('Tu pedido #', NEW.numero_pedido, ' ha sido confirmado. Total: $', NEW.total),
        'PEDIDO',
        CONCAT('/cuenta/pedidos/', NEW.id)
    );
END //

DELIMITER ;

-- =============================================
-- DATOS DE PRUEBA PARA NUEVAS TABLAS
-- =============================================

-- Insertar imágenes múltiples para productos
INSERT INTO producto_imagenes (producto_id, imagen_url, orden, es_principal) VALUES
-- Nike Air Max 270
(1, '/images/productos/nike-air-max-270/1.jpg', 1, TRUE),
(1, '/images/productos/nike-air-max-270/2.jpg', 2, FALSE),
(1, '/images/productos/nike-air-max-270/3.jpg', 3, FALSE),
(1, '/images/productos/nike-air-max-270/4.jpg', 4, FALSE),

-- Adidas Ultraboost 22
(2, '/images/productos/adidas-ultraboost-22/1.jpg', 1, TRUE),
(2, '/images/productos/adidas-ultraboost-22/2.jpg', 2, FALSE),
(2, '/images/productos/adidas-ultraboost-22/3.jpg', 3, FALSE),

-- Adidas Stan Smith
(4, '/images/productos/adidas-stan-smith/1.jpg', 1, TRUE),
(4, '/images/productos/adidas-stan-smith/2.jpg', 2, FALSE),

-- Vans Old Skool
(5, '/images/productos/vans-old-skool/1.jpg', 1, TRUE),
(5, '/images/productos/vans-old-skool/2.jpg', 2, FALSE),
(5, '/images/productos/vans-old-skool/3.jpg', 3, FALSE);

-- Insertar cupones de prueba
INSERT INTO cupones (codigo, descripcion, tipo, valor, max_descuento, min_compra, usos_maximos, fecha_inicio, fecha_fin) VALUES
('BIENVENIDA10', '10% de descuento en tu primera compra', 'PORCENTAJE', 10, 20, 50, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
('ENVIOGRATIS', 'Envío gratis en cualquier compra', 'ENVIO_GRATIS', 0, NULL, 0, 50, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY)),
('VERANO25', '25% de descuento en productos de verano', 'PORCENTAJE', 25, 50, 100, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY)),
('COMPRA50', '$50 de descuento en compras mayores a $200', 'MONTO_FIJO', 50, NULL, 200, 25, NOW(), DATE_ADD(NOW(), INTERVAL 45 DAY));

-- Insertar productos en wishlist
INSERT INTO wishlist (usuario_id, producto_id, notas) VALUES
(2, 1, 'Para cumpleaños'),
(2, 4, 'Zapatos casuales'),
(3, 2, 'Para running'),
(3, 6, 'Estilo clásico');

-- Insertar historial de precios de ejemplo
INSERT INTO historial_precios (producto_id, precio_anterior, precio_nuevo, tipo_cambio, motivo) VALUES
(1, 149.99, 129.99, 'REBAJA', 'Promoción de lanzamiento'),
(3, 89.99, 79.99, 'REBAJA', 'Oferta especial'),
(6, 74.99, 64.99, 'REBAJA', 'Descuento de temporada');

-- Actualizar productos con slugs y metadatos
UPDATE productos SET 
slug = REPLACE(LOWER(nombre), ' ', '-'),
meta_titulo = CONCAT(nombre, ' | StepUp Shoes'),
meta_descripcion = CONCAT('Comprar ', nombre, ' - ', SUBSTRING(descripcion, 1, 150), '...'),
peso_kg = 0.5,
largo_cm = 30.0,
ancho_cm = 10.0,
alto_cm = 12.0
WHERE slug IS NULL;

UPDATE categorias SET 
slug = REPLACE(LOWER(nombre), ' ', '-'),
meta_titulo = CONCAT(nombre, ' | StepUp Shoes'),
meta_descripcion = CONCAT('Compra ', nombre, ' de la mejor calidad. ', descripcion)
WHERE slug IS NULL;

-- =============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para búsquedas avanzadas
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_categorias_slug ON categorias(slug);
CREATE INDEX idx_productos_valoracion_stock ON productos(valoracion_promedio, stock, activo);

-- Índices para reportes y analytics
CREATE INDEX idx_pedidos_fecha_completa ON pedidos(fecha_creacion, estado, total);
CREATE INDEX idx_detalles_pedido_producto_fecha ON detalles_pedido(producto_id, pedido_id);
CREATE INDEX idx_resenas_producto_fecha ON reseñas(producto_id, fecha_creacion, aprobado);

-- Índices para sistema de cupones
CREATE INDEX idx_cupones_fecha_activo ON cupones(fecha_inicio, fecha_fin, activo);
CREATE INDEX idx_cupones_usados_usuario_fecha ON cupones_usados(usuario_id, fecha_uso);

-- Índices para inventario
CREATE INDEX idx_inventario_producto_talla ON inventario_movimientos(producto_id, talla, fecha_movimiento);
CREATE INDEX idx_producto_tallas_stock ON producto_tallas(stock, producto_id);

-- =============================================
-- CONSULTAS DE VERIFICACIÓN FINAL
-- =============================================

-- Verificar todas las nuevas tablas
SELECT 
    TABLE_NAME as 'Tabla',
    TABLE_ROWS as 'Registros'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'stepup_shoes'
ORDER BY TABLE_NAME;

-- Verificar vistas creadas
SELECT 
    TABLE_NAME as 'Vista'
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = 'stepup_shoes'
ORDER BY TABLE_NAME;

-- Verificar procedimientos almacenados
SELECT 
    ROUTINE_NAME as 'Procedimiento',
    ROUTINE_TYPE as 'Tipo'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'stepup_shoes'
ORDER BY ROUTINE_NAME;

-- Mostrar productos con imágenes múltiples
SELECT 
    p.nombre,
    p.slug,
    COUNT(pi.id) as total_imagenes,
    p.valoracion_promedio,
    p.total_valoraciones
FROM productos p
LEFT JOIN producto_imagenes pi ON p.id = pi.producto_id
GROUP BY p.id, p.nombre, p.slug, p.valoracion_promedio, p.total_valoraciones
ORDER BY p.nombre;

-- Mostrar cupones activos
SELECT 
    codigo,
    tipo,
    valor,
    fecha_inicio,
    fecha_fin,
    usos_actuales,
    usos_maximos
FROM cupones 
WHERE activo = TRUE 
AND fecha_inicio <= NOW() 
AND fecha_fin >= NOW()
ORDER BY fecha_inicio;

-- =============================================
-- MENSAJE FINAL DE ACTUALIZACIÓN
-- =============================================

SELECT '=============================================' as '';
SELECT 'MEJORAS STEPUP SHOES IMPLEMENTADAS EXITOSAMENTE' as '';
SELECT '=============================================' as '';
SELECT CONCAT('Nuevas tablas creadas: ', (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'stepup_shoes') - 12) as '';
SELECT CONCAT('Nuevas vistas creadas: ', (SELECT COUNT(*) FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'stepup_shoes') - 3) as '';
SELECT CONCAT('Nuevos procedimientos: ', (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'stepup_shoes' AND ROUTINE_TYPE = 'PROCEDURE') - 4) as '';
SELECT CONCAT('Nuevos triggers: ', (SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'stepup_shoes') - 3) as '';
SELECT '=============================================' as '';
SELECT 'FUNCIONALIDADES AGREGADAS:' as '';
SELECT '  ✅ Sistema de imágenes múltiples' as '';
SELECT '  ✅ Historial de precios' as '';
SELECT '  ✅ Sistema de cupones y descuentos' as '';
SELECT '  ✅ Lista de deseos (Wishlist)' as '';
SELECT '  ✅ Sistema de notificaciones' as '';
SELECT '  ✅ Control detallado de inventario' as '';
SELECT '  ✅ Seguimiento de envíos avanzado' as '';
SELECT '  ✅ Sistema de pagos detallado' as '';
SELECT '  ✅ Metadatos SEO para productos' as '';
SELECT '  ✅ Valoraciones y reseñas mejoradas' as '';
SELECT '  ✅ Productos relacionados' as '';
SELECT '  ✅ Reportes y analytics avanzados' as '';
SELECT '=============================================' as '';