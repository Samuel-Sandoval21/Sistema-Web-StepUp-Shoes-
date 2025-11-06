-- =============================================
-- BASE DE DATOS: stepup_shoes
-- AUTOR: StepUp Shoes Team
-- FECHA: 2024
-- =============================================

-- Crear la base de datos
DROP DATABASE IF EXISTS stepup_shoes;
CREATE DATABASE stepup_shoes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE stepup_shoes;

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- Tabla: categorias
CREATE TABLE categorias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    
    INDEX idx_categoria_activo (activo),
    INDEX idx_categoria_nombre (nombre)
);

-- Tabla: productos
CREATE TABLE productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10,2) CHECK (precio_original >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url VARCHAR(500),
    destacado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    categoria_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_producto_categoria (categoria_id),
    INDEX idx_producto_destacado (destacado),
    INDEX idx_producto_activo (activo),
    INDEX idx_producto_precio (precio),
    INDEX idx_producto_fecha (fecha_creacion)
);

-- Tabla: producto_tallas
CREATE TABLE producto_tallas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    talla INT NOT NULL CHECK (talla BETWEEN 35 AND 50),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_producto_talla (producto_id, talla),
    INDEX idx_producto_talla_producto (producto_id),
    INDEX idx_producto_talla_talla (talla)
);

-- Tabla: usuarios
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_sesion TIMESTAMP NULL,
    activo BOOLEAN DEFAULT TRUE,
    rol ENUM('CLIENTE', 'ADMINISTRADOR', 'EMPLEADO') DEFAULT 'CLIENTE',
    codigo_verificacion VARCHAR(6),
    verificado BOOLEAN DEFAULT FALSE,
    
    INDEX idx_usuario_email (email),
    INDEX idx_usuario_activo (activo),
    INDEX idx_usuario_rol (rol),
    INDEX idx_usuario_verificado (verificado)
);

-- Tabla: direcciones
CREATE TABLE direcciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    alias VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    pais VARCHAR(100) DEFAULT 'Costa Rica',
    telefono VARCHAR(20),
    predeterminada BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_predeterminada (usuario_id, predeterminada),
    INDEX idx_direccion_usuario (usuario_id),
    INDEX idx_direccion_predeterminada (predeterminada)
);

-- Tabla: pedidos
CREATE TABLE pedidos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    envio DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (envio >= 0),
    estado ENUM('PENDIENTE', 'CONFIRMADO', 'PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO') DEFAULT 'PENDIENTE',
    metodo_pago ENUM('TARJETA', 'PAYPAL', 'TRANSFERENCIA', 'EFECTIVO') DEFAULT 'TARJETA',
    metodo_envio VARCHAR(50) DEFAULT 'estandar',
    
    -- Información de envío
    nombre_envio VARCHAR(100) NOT NULL,
    email_envio VARCHAR(150) NOT NULL,
    telefono_envio VARCHAR(20) NOT NULL,
    direccion_envio TEXT NOT NULL,
    ciudad_envio VARCHAR(100) NOT NULL,
    estado_envio VARCHAR(100) NOT NULL,
    codigo_postal_envio VARCHAR(20) NOT NULL,
    pais_envio VARCHAR(100) DEFAULT 'Costa Rica',
    
    -- Información de pago (simplificada)
    transaccion_id VARCHAR(100),
    estado_pago ENUM('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO') DEFAULT 'PENDIENTE',
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP NULL,
    fecha_envio TIMESTAMP NULL,
    fecha_entrega TIMESTAMP NULL,
    fecha_cancelacion TIMESTAMP NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_pedido_usuario (usuario_id),
    INDEX idx_pedido_estado (estado),
    INDEX idx_pedido_fecha_creacion (fecha_creacion),
    INDEX idx_pedido_numero (numero_pedido),
    INDEX idx_pedido_estado_pago (estado_pago)
);

-- Tabla: detalles_pedido
CREATE TABLE detalles_pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    talla INT NOT NULL CHECK (talla BETWEEN 35 AND 50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    INDEX idx_detalle_pedido (pedido_id),
    INDEX idx_detalle_producto (producto_id)
);

-- Tabla: favoritos
CREATE TABLE favoritos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_producto (usuario_id, producto_id),
    INDEX idx_favorito_usuario (usuario_id),
    INDEX idx_favorito_producto (producto_id)
);

-- Tabla: reseñas
CREATE TABLE reseñas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    pedido_id BIGINT NOT NULL, -- Para verificar que compró el producto
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    titulo VARCHAR(200),
    comentario TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    aprobado BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_producto_pedido (usuario_id, producto_id, pedido_id),
    INDEX idx_resena_producto (producto_id),
    INDEX idx_resena_calificacion (calificacion),
    INDEX idx_resena_aprobado (aprobado)
);

-- Tabla: carrito_compras
CREATE TABLE carrito_compras (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    talla INT NOT NULL CHECK (talla BETWEEN 35 AND 50),
    cantidad INT NOT NULL CHECK (cantidad BETWEEN 1 AND 5),
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_producto_talla (usuario_id, producto_id, talla),
    INDEX idx_carrito_usuario (usuario_id)
);

-- Tabla: configuraciones
CREATE TABLE configuraciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_configuracion_clave (clave)
);

-- Tabla: sesiones_verificacion
CREATE TABLE sesiones_verificacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    tipo ENUM('REGISTRO', 'RECUPERACION', 'CAMBIO_EMAIL') NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expiracion TIMESTAMP NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_sesion_usuario (usuario_id),
    INDEX idx_sesion_token (token),
    INDEX idx_sesion_expiracion (expiracion)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion, imagen_url) VALUES 
('Deportivos', 'Zapatillas para deporte y actividad física. Diseños modernos con tecnología avanzada para máximo rendimiento.', '/images/categorias/deportivos.jpg'),
('Casual', 'Zapatos informales para uso diario. Estilo y comodidad para tu día a día.', '/images/categorias/casual.jpg'),
('Formal', 'Zapatos elegantes para ocasiones especiales. Elegancia y sofisticación para eventos importantes.', '/images/categorias/formal.jpg'),
('Running', 'Zapatillas especializadas para correr. Tecnología de amortiguación y soporte para runners.', '/images/categorias/running.jpg'),
('Skate', 'Zapatillas para skateboarding. Durabilidad y estilo para la cultura skate.', '/images/categorias/skate.jpg'),
('Basketball', 'Zapatillas para baloncesto. Diseñadas para máximo rendimiento en la cancha.', '/images/categorias/basketball.jpg');

-- Insertar productos
INSERT INTO productos (nombre, descripcion, precio, precio_original, stock, imagen_url, destacado, categoria_id) VALUES 
-- Deportivos
('Nike Air Max 270', 'Zapatillas deportivas con tecnología Air Max para máxima comodidad y amortiguación. Perfectas para el día a día y actividades deportivas. Materiales transpirables y suela durable.', 129.99, 149.99, 25, '/images/productos/nike-air-max-270.jpg', TRUE, 1),
('Adidas Ultraboost 22', 'Zapatillas de running con tecnología Boost para una amortiguación responsive. Ideales para corredores que buscan comodidad y rendimiento. Diseño ergonómico y soporte superior.', 179.99, NULL, 30, '/images/productos/adidas-ultraboost-22.jpg', TRUE, 4),
('Nike Revolution 6', 'Zapatillas de running con espuma suave para una pisada cómoda. Diseño transpirable y ligero para carreras diarias. Perfectas para entrenamientos y uso casual.', 79.99, 89.99, 40, '/images/productos/nike-revolution-6.jpg', FALSE, 4),

-- Casual
('Adidas Stan Smith', 'Clásicas zapatillas casuales de cuero blanco con detalles verdes. Diseño timeless que combina con cualquier outfit. Versátiles y cómodas para todo momento.', 89.99, 99.99, 35, '/images/productos/adidas-stan-smith.jpg', TRUE, 2),
('Vans Old Skool', 'Zapatillas skate clásicas con la icónica raya lateral. Duraderas y versátiles para el estilo urbano. Suela de caucho para mejor tracción.', 69.99, NULL, 50, '/images/productos/vans-old-skool.jpg', FALSE, 5),
('Converse Chuck Taylor All Star', 'Iconicas zapatillas de lona alta, perfectas para cualquier ocasión. Un clásico del calzado casual. Diseño versátil que nunca pasa de moda.', 64.99, 74.99, 45, '/images/productos/converse-chuck-taylor.jpg', TRUE, 2),

-- Formal
('Clarks Desert Boot', 'Botas desert clásicas en suede, perfectas para looks casual-elegantes. Comodidad y estilo en un solo zapato. Ideal para oficina y eventos.', 149.99, NULL, 20, '/images/productos/clarks-desert-boot.jpg', FALSE, 3),
('Dr. Martens 1460', 'Botas clásicas de cuero con suela air-cushioned. Duraderas, cómodas y con un estilo único. Icono de la moda alternativa.', 189.99, 199.99, 15, '/images/productos/dr-martens-1460.jpg', TRUE, 3),

-- Basketball
('Nike Air Jordan 1', 'Zapatillas de basketball legendarias que revolucionaron el calzado deportivo. Icono de la cultura urbana. Diseño clásico con tecnología moderna.', 169.99, 189.99, 10, '/images/productos/air-jordan-1.jpg', TRUE, 6),
('Adidas Harden Vol. 6', 'Zapatillas de basketball de alto rendimiento diseñadas para James Harden. Tecnología Lightstrike para máxima velocidad y respuesta.', 139.99, NULL, 18, '/images/productos/harden-vol6.jpg', FALSE, 6);

-- Insertar tallas disponibles
INSERT INTO producto_tallas (producto_id, talla, stock) VALUES 
-- Nike Air Max 270
(1, 38, 5), (1, 39, 5), (1, 40, 5), (1, 41, 5), (1, 42, 5),
-- Adidas Ultraboost 22
(2, 39, 6), (2, 40, 6), (2, 41, 6), (2, 42, 6), (2, 43, 6),
-- Nike Revolution 6
(3, 38, 8), (3, 39, 8), (3, 40, 8), (3, 41, 8), (3, 42, 8),
-- Adidas Stan Smith
(4, 37, 7), (4, 38, 7), (4, 39, 7), (4, 40, 7), (4, 41, 7),
-- Vans Old Skool
(5, 36, 10), (5, 37, 10), (5, 38, 10), (5, 39, 10), (5, 40, 10),
-- Converse Chuck Taylor
(6, 37, 9), (6, 38, 9), (6, 39, 9), (6, 40, 9), (6, 41, 9),
-- Clarks Desert Boot
(7, 39, 4), (7, 40, 4), (7, 41, 4), (7, 42, 4), (7, 43, 4),
-- Dr. Martens 1460
(8, 40, 3), (8, 41, 3), (8, 42, 3), (8, 43, 3), (8, 44, 3),
-- Nike Air Jordan 1
(9, 40, 2), (9, 41, 2), (9, 42, 2), (9, 43, 2), (9, 44, 2),
-- Adidas Harden Vol. 6
(10, 41, 3), (10, 42, 3), (10, 43, 3), (10, 44, 3), (10, 45, 3);

-- Insertar usuarios (contraseñas: admin123 y cliente123)
INSERT INTO usuarios (nombre, email, password, telefono, fecha_nacimiento, rol, verificado) VALUES 
('Administrador StepUp', 'admin@stepupshoes.com', '$2a$10$ABCDEFGHIJKLMNOPQRSTUVWXYZ012345', '+506 2222 2222', '1990-01-01', 'ADMINISTRADOR', TRUE),
('Juan Carlos Pérez', 'cliente@ejemplo.com', '$2a$10$ABCDEFGHIJKLMNOPQRSTUVWXYZ012346', '+506 8888 8888', '1995-05-15', 'CLIENTE', TRUE),
('María Rodríguez', 'maria.rodriguez@email.com', '$2a$10$ABCDEFGHIJKLMNOPQRSTUVWXYZ012347', '+506 7777 7777', '1992-08-20', 'CLIENTE', TRUE);

-- Insertar direcciones de ejemplo
INSERT INTO direcciones (usuario_id, alias, nombre_completo, direccion, ciudad, estado, codigo_postal, telefono, predeterminada) VALUES 
(2, 'Casa', 'Juan Carlos Pérez', 'Avenida Central, Calle 25, Casa #123', 'San José', 'San José', '10101', '+506 8888 8888', TRUE),
(2, 'Trabajo', 'Juan Carlos Pérez', 'Edificio Corporativo, Piso 5, Oficina 502', 'San José', 'San José', '10102', '+506 8888 8889', FALSE),
(3, 'Casa', 'María Rodríguez', 'Residencial Las Flores, Casa #45', 'Alajuela', 'Alajuela', '20101', '+506 7777 7777', TRUE);

-- Insertar configuraciones del sistema
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES 
('envio_gratis_minimo', '100', 'NUMBER', 'Monto mínimo para envío gratis'),
('envio_estandar_precio', '10', 'NUMBER', 'Precio del envío estándar'),
('envio_express_precio', '20', 'NUMBER', 'Precio del envío express'),
('impuesto_porcentaje', '13', 'NUMBER', 'Porcentaje de impuesto'),
('tienda_nombre', 'StepUp Shoes', 'STRING', 'Nombre de la tienda'),
('tienda_email', 'info@stepupshoes.com', 'STRING', 'Email de contacto'),
('tienda_telefono', '+506 2556 7890', 'STRING', 'Teléfono de la tienda'),
('tienda_direccion', 'San José, Costa Rica', 'STRING', 'Dirección de la tienda'),
('politica_devoluciones_dias', '30', 'NUMBER', 'Días para devoluciones'),
('max_productos_carrito', '5', 'NUMBER', 'Máximo de productos por item en carrito');

-- =============================================
-- VISTAS
-- =============================================

-- Vista: productos con información de categoría
CREATE OR REPLACE VIEW vista_productos AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.precio_original,
    p.stock,
    p.imagen_url,
    p.destacado,
    p.activo,
    p.categoria_id,
    c.nombre as categoria_nombre,
    c.descripcion as categoria_descripcion,
    CASE 
        WHEN p.precio_original IS NOT NULL THEN ROUND(((p.precio_original - p.precio) / p.precio_original) * 100, 0)
        ELSE 0
    END as descuento_porcentaje,
    CASE 
        WHEN p.precio_original IS NOT NULL THEN (p.precio_original - p.precio)
        ELSE 0
    END as ahorro,
    p.fecha_creacion,
    p.fecha_actualizacion
FROM productos p
INNER JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = TRUE AND c.activo = TRUE;

-- Vista: pedidos con información del usuario
CREATE OR REPLACE VIEW vista_pedidos AS
SELECT 
    p.id,
    p.numero_pedido,
    p.usuario_id,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    p.total,
    p.subtotal,
    p.envio,
    p.estado,
    p.metodo_pago,
    p.metodo_envio,
    p.estado_pago,
    p.fecha_creacion,
    p.fecha_confirmacion,
    p.fecha_envio,
    p.fecha_entrega,
    COUNT(d.id) as total_items,
    SUM(d.cantidad) as total_productos
FROM pedidos p
INNER JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN detalles_pedido d ON p.id = d.pedido_id
GROUP BY p.id, p.numero_pedido, p.usuario_id, u.nombre, u.email, p.total, p.subtotal, p.envio, p.estado, p.metodo_pago, p.metodo_envio, p.estado_pago, p.fecha_creacion, p.fecha_confirmacion, p.fecha_envio, p.fecha_entrega;

-- Vista: carrito de compras con información del producto
CREATE OR REPLACE VIEW vista_carrito AS
SELECT 
    c.id,
    c.usuario_id,
    c.producto_id,
    c.talla,
    c.cantidad,
    c.fecha_agregado,
    p.nombre as producto_nombre,
    p.precio as producto_precio,
    p.imagen_url as producto_imagen,
    p.stock as producto_stock,
    pt.stock as talla_stock,
    (p.precio * c.cantidad) as subtotal
FROM carrito_compras c
INNER JOIN productos p ON c.producto_id = p.id
LEFT JOIN producto_tallas pt ON c.producto_id = pt.producto_id AND c.talla = pt.talla
WHERE p.activo = TRUE;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

DELIMITER //

-- Procedimiento: Actualizar stock después de un pedido
CREATE PROCEDURE sp_actualizar_stock_pedido(IN p_pedido_id BIGINT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_producto_id BIGINT;
    DECLARE v_talla INT;
    DECLARE v_cantidad INT;
    
    -- Cursor para recorrer los detalles del pedido
    DECLARE cur CURSOR FOR 
        SELECT producto_id, talla, cantidad 
        FROM detalles_pedido 
        WHERE pedido_id = p_pedido_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_producto_id, v_talla, v_cantidad;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Actualizar stock en producto_tallas
        UPDATE producto_tallas 
        SET stock = stock - v_cantidad 
        WHERE producto_id = v_producto_id AND talla = v_talla;
        
        -- Actualizar stock general del producto
        UPDATE productos 
        SET stock = (
            SELECT SUM(stock) 
            FROM producto_tallas 
            WHERE producto_id = v_producto_id
        ) 
        WHERE id = v_producto_id;
    END LOOP;
    
    CLOSE cur;
END //

-- Procedimiento: Generar número de pedido único
CREATE PROCEDURE sp_generar_numero_pedido(OUT p_numero_pedido VARCHAR(50))
BEGIN
    DECLARE nuevo_numero VARCHAR(50);
    DECLARE contador INT DEFAULT 1;
    
    REPEAT
        SET nuevo_numero = CONCAT('PED', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(contador, 4, '0'));
        SET contador = contador + 1;
    UNTIL NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = nuevo_numero) END REPEAT;
    
    SET p_numero_pedido = nuevo_numero;
END //

-- Procedimiento: Obtener productos destacados
CREATE PROCEDURE sp_obtener_productos_destacados()
BEGIN
    SELECT * FROM vista_productos 
    WHERE destacado = TRUE 
    ORDER BY fecha_creacion DESC 
    LIMIT 8;
END //

-- Procedimiento: Obtener estadísticas de ventas
CREATE PROCEDURE sp_estadisticas_ventas(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    SELECT 
        COUNT(*) as total_pedidos,
        SUM(total) as total_ventas,
        AVG(total) as promedio_venta,
        COUNT(DISTINCT usuario_id) as clientes_unicos
    FROM pedidos 
    WHERE fecha_creacion BETWEEN p_fecha_inicio AND p_fecha_fin 
    AND estado NOT IN ('CANCELADO');
END //

DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

DELIMITER //

-- Trigger: Actualizar fecha_actualizacion en productos
CREATE TRIGGER tr_productos_actualizacion 
BEFORE UPDATE ON productos 
FOR EACH ROW 
BEGIN
    SET NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
END //

-- Trigger: Validar stock antes de insertar en carrito
CREATE TRIGGER tr_carrito_validar_stock 
BEFORE INSERT ON carrito_compras 
FOR EACH ROW 
BEGIN
    DECLARE v_stock_disponible INT;
    
    SELECT stock INTO v_stock_disponible 
    FROM producto_tallas 
    WHERE producto_id = NEW.producto_id AND talla = NEW.talla;
    
    IF v_stock_disponible IS NULL OR v_stock_disponible < NEW.cantidad THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Stock insuficiente para el producto y talla seleccionados';
    END IF;
END //

-- Trigger: Actualizar última sesión del usuario
CREATE TRIGGER tr_usuario_ultima_sesion 
BEFORE UPDATE ON usuarios 
FOR EACH ROW 
BEGIN
    IF NEW.ultima_sesion IS NULL AND OLD.ultima_sesion IS NOT NULL THEN
        SET NEW.ultima_sesion = OLD.ultima_sesion;
    END IF;
END //

DELIMITER ;

-- =============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para búsquedas de productos
CREATE FULLTEXT INDEX idx_productos_busqueda ON productos(nombre, descripcion);
CREATE INDEX idx_productos_precio_rango ON productos(precio, activo);
CREATE INDEX idx_productos_categoria_activo ON productos(categoria_id, activo);

-- Índices para pedidos
CREATE INDEX idx_pedidos_usuario_estado ON pedidos(usuario_id, estado);
CREATE INDEX idx_pedidos_fecha_estado ON pedidos(fecha_creacion, estado);
CREATE INDEX idx_pedidos_estado_pago ON pedidos(estado_pago, estado);

-- Índices para detalles_pedido
CREATE INDEX idx_detalles_pedido_completo ON detalles_pedido(pedido_id, producto_id);

-- =============================================
-- CONSULTAS DE VERIFICACIÓN
-- =============================================

-- Verificar que la base de datos se creó correctamente
SELECT 
    'Categorías' as tabla, 
    COUNT(*) as registros 
FROM categorias
UNION ALL
SELECT 
    'Productos', 
    COUNT(*) 
FROM productos
UNION ALL
SELECT 
    'Usuarios', 
    COUNT(*) 
FROM usuarios
UNION ALL
SELECT 
    'Tallas de Productos', 
    COUNT(*) 
FROM producto_tallas;

-- Mostrar productos destacados
SELECT 
    nombre, 
    precio, 
    categoria_nombre 
FROM vista_productos 
WHERE destacado = TRUE;

-- Mostrar configuración del sistema
SELECT 
    clave, 
    valor, 
    descripcion 
FROM configuraciones 
ORDER BY clave;

-- =============================================
-- MENSAJE FINAL
-- =============================================

SELECT '=============================================' as '';
SELECT 'BASE DE DATOS STEPUP SHOES CREADA EXITOSAMENTE' as '';
SELECT '=============================================' as '';
SELECT 'Tablas creadas: 12' as '';
SELECT 'Registros insertados: ' as '';
SELECT CONCAT('  - Categorías: ', (SELECT COUNT(*) FROM categorias)) as '';
SELECT CONCAT('  - Productos: ', (SELECT COUNT(*) FROM productos)) as '';
SELECT CONCAT('  - Usuarios: ', (SELECT COUNT(*) FROM usuarios)) as '';
SELECT CONCAT('  - Tallas: ', (SELECT COUNT(*) FROM producto_tallas)) as '';
SELECT 'Vistas creadas: 3' as '';
SELECT 'Procedimientos almacenados: 4' as '';
SELECT 'Triggers creados: 3' as '';
SELECT '=============================================' as '';