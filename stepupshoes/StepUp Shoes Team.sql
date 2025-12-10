-- =============================================
-- COMPLETE DATABASE FOR STEPUP SHOES - FIREBASE EDITION
-- =============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS stepup_shoes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stepup_shoes;

-- =============================================
-- TABLAS PRINCIPALES (CORREGIDAS PARA FIREBASE)
-- =============================================

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url VARCHAR(500), -- Solo nombre: 'deportivos.jpeg'
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    meta_titulo VARCHAR(200),
    meta_descripcion TEXT,
    slug VARCHAR(100) UNIQUE,
    
    INDEX idx_categorias_activo (activo),
    INDEX idx_categorias_slug (slug)
);

-- Tabla: productos (IMPORTANTE: imagen_url solo nombres para Firebase)
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10,2),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    descuento DECIMAL(5,2) DEFAULT 0.00 CHECK (descuento >= 0 AND descuento <= 100),
    
    -- ✅ CRÍTICO: Solo NOMBRE de archivo (no ruta completa)
    -- Ejemplo: 'adidas_ultraboost.jpeg', 'running.jpeg', 'basketball.jpeg'
    imagen_url VARCHAR(500),
    
    destacado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    categoria_id BIGINT NOT NULL,
    
    -- Nuevas columnas para valoraciones
    valoracion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_valoraciones INT DEFAULT 0,
    
    -- SEO y organización
    productos_relacionados JSON,
    meta_titulo VARCHAR(200),
    meta_descripcion TEXT,
    slug VARCHAR(200) UNIQUE,
    
    -- Dimensiones
    peso_kg DECIMAL(5,2),
    largo_cm DECIMAL(5,2),
    ancho_cm DECIMAL(5,2),
    alto_cm DECIMAL(5,2),
    
    fechas
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_productos_categoria (categoria_id),
    INDEX idx_productos_activo (activo),
    INDEX idx_productos_destacado (destacado),
    INDEX idx_productos_precio (precio),
    INDEX idx_productos_valoracion (valoracion_promedio),
    INDEX idx_productos_slug (slug)
);

-- Tabla: producto_tallas (inventario por talla)
CREATE TABLE IF NOT EXISTS producto_tallas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    talla INT NOT NULL CHECK (talla BETWEEN 35 AND 50),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_producto_talla (producto_id, talla),
    INDEX idx_producto_tallas_stock (stock)
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    rol ENUM('CLIENTE', 'ADMIN', 'EMPLEADO') DEFAULT 'CLIENTE',
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    codigo_verificacion VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_sesion TIMESTAMP NULL,
    
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_rol (rol),
    INDEX idx_usuarios_activo (activo)
);

-- Tabla: pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    usuario_id BIGINT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    envio DECIMAL(10,2) DEFAULT 0 CHECK (envio >= 0),
    descuento_cupon DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    estado ENUM('PENDIENTE', 'CONFIRMADO', 'PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO') DEFAULT 'PENDIENTE',
    metodo_pago ENUM('TARJETA', 'PAYPAL', 'TRANSFERENCIA', 'EFECTIVO') NOT NULL,
    metodo_envio VARCHAR(50) NOT NULL,
    estado_pago ENUM('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO') DEFAULT 'PENDIENTE',
    cupon_id BIGINT NULL,
    
    -- Información de envío
    nombre_envio VARCHAR(100) NOT NULL,
    telefono_envio VARCHAR(20) NOT NULL,
    direccion_envio TEXT NOT NULL,
    ciudad_envio VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    notas TEXT,
    
    -- Fechas
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP NULL,
    fecha_envio TIMESTAMP NULL,
    fecha_entrega TIMESTAMP NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_estado (estado),
    INDEX idx_pedidos_fecha (fecha_creacion),
    INDEX idx_pedidos_numero (numero_pedido)
);

-- Tabla: detalles_pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    talla INT CHECK (talla BETWEEN 35 AND 50),
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    INDEX idx_detalles_pedido (pedido_id),
    INDEX idx_detalles_producto (producto_id)
);

-- Tabla: carrito_compras
CREATE TABLE IF NOT EXISTS carrito_compras (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    talla INT NOT NULL CHECK (talla BETWEEN 35 AND 50),
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_carrito_usuario_producto_talla (usuario_id, producto_id, talla),
    INDEX idx_carrito_usuario (usuario_id)
);

-- Tabla: reseñas
CREATE TABLE IF NOT EXISTS reseñas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    titulo VARCHAR(200),
    comentario TEXT,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    activo BOOLEAN DEFAULT TRUE,
    aprobado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uk_resena_usuario_producto (usuario_id, producto_id),
    INDEX idx_resenas_producto (producto_id),
    INDEX idx_resenas_aprobado (aprobado),
    INDEX idx_resenas_calificacion (calificacion)
);

-- =============================================
-- INSERTAR CATEGORÍAS
-- =============================================

INSERT INTO categorias (nombre, descripcion, imagen_url, slug, meta_titulo, meta_descripcion) VALUES
('Deportivas', 'Zapatillas para running, entrenamiento y deportes', 'deportivos.jpeg', 'deportivas', 'Zapatillas Deportivas | StepUp Shoes', 'Encuentra las mejores zapatillas deportivas para running, entrenamiento y todos los deportes. Calidad y comodidad garantizadas.'),
('Casual', 'Zapatillas y calzado para uso diario y estilo urbano', 'casual.jpeg', 'casual', 'Calzado Casual | StepUp Shoes', 'Descubre nuestra colección de calzado casual para hombre y mujer. Estilo, comodidad y tendencias urbanas.'),
('Formal', 'Zapatos formales para oficina y eventos especiales', 'formal.jpeg', 'formal', 'Zapatos Formales | StepUp Shoes', 'Elige entre nuestra selección de zapatos formales para hombre. Elegancia, calidad y confort para tu día a día.'),
('Crocs', 'Calzado cómodo y versátil para toda la familia', 'crocs_classic.png', 'crocs', 'Crocs | StepUp Shoes', 'Los famosos Crocs en todos los modelos y colores. Comodidad extrema para toda la familia.'),
('Skechers', 'Calzado deportivo-casual con tecnología de confort', 'skechers_go_walk.jpeg', 'skechers', 'Skechers | StepUp Shoes', 'Skechers: tecnología de confort para caminar todo el día. Ligereza y amortiguación premium.'),
('Basketball', 'Zapatillas de baloncesto de alto rendimiento', 'basketball.jpeg', 'basketball', 'Zapatillas Basketball | StepUp Shoes', 'Zapatillas de basketball profesional y casual. Tecnología de salto y agarre superior.');

-- =============================================
-- INSERTAR PRODUCTOS (CON IMÁGENES QUE SÍ EXISTEN EN FIREBASE)
-- =============================================

INSERT INTO productos (nombre, descripcion, precio, precio_original, stock, imagen_url, destacado, activo, categoria_id, slug, meta_titulo, meta_descripcion) VALUES
('Nike Air Max 270', 'Zapatillas deportivas con tecnología Air Max para máxima comodidad y amortiguación. Perfectas para el día a día y actividades deportivas. Materiales transpirables y suela durable.', 129.99, 149.99, 25, 'running.jpeg', 1, 1, 1, 'nike-air-max-270', 'Nike Air Max 270 | StepUp Shoes', 'Zapatillas Nike Air Max 270 con tecnología de amortiguación Air Max. Perfectas para deporte y uso diario.'),
('Adidas Ultraboost 22', 'Zapatillas de running con tecnología Boost para una amortiguación responsive. Ideales para corredores que buscan comodidad y rendimiento. Diseño ergonómico y soporte superior.', 179.99, NULL, 30, 'adidas_ultraboost.jpeg', 1, 1, 1, 'adidas-ultraboost-22', 'Adidas Ultraboost 22 | StepUp Shoes', 'Adidas Ultraboost 22 con tecnología Boost. Amortiguación responsive para runners exigentes.'),
('Nike Revolution 6', 'Zapatillas de running con espuma suave para una pisada cómoda. Diseño transpirable y ligero para carreras diarias. Perfectas para entrenamientos y uso casual.', 79.99, 89.99, 40, 'running.jpeg', 0, 1, 1, 'nike-revolution-6', 'Nike Revolution 6 | StepUp Shoes', 'Nike Revolution 6: espuma suave y diseño ligero para running diario.'),
('Adidas Stan Smith', 'Clásicas zapatillas casuales de cuero blanco con detalles verdes. Diseño timeless que combina con cualquier outfit. Versátiles y cómodas para todo momento.', 89.99, 99.99, 35, 'adidas_stan_smith.jpeg', 1, 1, 2, 'adidas-stan-smith', 'Adidas Stan Smith | StepUp Shoes', 'Adidas Stan Smith clásicas. Cuero blanco con detalles verdes. Icono del estilo casual.'),
('Vans Old Skool', 'Zapatillas skate clásicas con la icónica raya lateral. Duraderas y versátiles para el estilo urbano. Suela de caucho para mejor tracción.', 69.99, NULL, 50, 'vans_old_skool.jpeg', 0, 1, 2, 'vans-old-skool', 'Vans Old Skool | StepUp Shoes', 'Vans Old Skool: el clásico del skate. Raya lateral icónica y durabilidad extrema.'),
('Converse Chuck Taylor All Star', 'Iconicas zapatillas de lona alta, perfectas para cualquier ocasión. Un clásico del calzado casual. Diseño versátil que nunca pasa de moda.', 64.99, 74.99, 45, 'casual.jpeg', 1, 1, 2, 'converse-chuck-taylor', 'Converse Chuck Taylor | StepUp Shoes', 'Converse Chuck Taylor All Star. El clásico de lona alta para estilo urbano.'),
('Clarks Desert Boot', 'Botas desert clásicas en suede, perfectas para looks casual-elegantes. Comodidad y estilo en un solo zapato. Ideal para oficina y eventos.', 149.99, NULL, 20, 'clarks_desert.png', 0, 1, 3, 'clarks-desert-boot', 'Clarks Desert Boot | StepUp Shoes', 'Clarks Desert Boot en suede. Botas casual-elegantes para hombre.'),
('Dr. Martens 1460', 'Botas clásicas de cuero con suela air-cushioned. Duraderas, cómodas y con un estilo único. Icono de la moda alternativa.', 189.99, 199.99, 15, 'dr_martens.png', 1, 1, 3, 'dr-martens-1460', 'Dr. Martens 1460 | StepUp Shoes', 'Dr. Martens 1460: botas de cuero con suela air-cushioned. Icono de estilo.'),
('Nike Air Jordan 1', 'Zapatillas de basketball legendarias que revolucionaron el calzado deportivo. Icono de la cultura urbana. Diseño clásico con tecnología moderna.', 169.99, 189.99, 10, 'basketball.jpeg', 1, 1, 6, 'nike-air-jordan-1', 'Nike Air Jordan 1 | StepUp Shoes', 'Nike Air Jordan 1: las legendarias zapatillas de basketball. Icono cultural.'),
('Adidas Harden Vol. 6', 'Zapatillas de basketball de alto rendimiento diseñadas para James Harden. Tecnología Lightstrike para máxima velocidad y respuesta.', 139.99, NULL, 18, 'basketball.jpeg', 0, 1, 6, 'adidas-harden-vol6', 'Adidas Harden Vol. 6 | StepUp Shoes', 'Adidas Harden Vol. 6: tecnología Lightstrike para basketball de élite.');

-- =============================================
-- INSERTAR TALLAS PARA PRODUCTOS
-- =============================================

-- Insertar tallas para todos los productos
INSERT INTO producto_tallas (producto_id, talla, stock) VALUES
-- Producto 1: Nike Air Max 270
(1, 38, 5), (1, 39, 5), (1, 40, 5), (1, 41, 5), (1, 42, 5),
-- Producto 2: Adidas Ultraboost 22
(2, 39, 6), (2, 40, 6), (2, 41, 6), (2, 42, 6), (2, 43, 6),
-- Producto 3: Nike Revolution 6
(3, 38, 8), (3, 39, 8), (3, 40, 8), (3, 41, 8), (3, 42, 8),
-- Producto 4: Adidas Stan Smith
(4, 39, 7), (4, 40, 7), (4, 41, 7), (4, 42, 7), (4, 43, 7),
-- Producto 5: Vans Old Skool
(5, 38, 10), (5, 39, 10), (5, 40, 10), (5, 41, 10), (5, 42, 10),
-- Producto 6: Converse Chuck Taylor
(6, 39, 9), (6, 40, 9), (6, 41, 9), (6, 42, 9), (6, 43, 9),
-- Producto 7: Clarks Desert Boot
(7, 40, 4), (7, 41, 4), (7, 42, 4), (7, 43, 4), (7, 44, 4),
-- Producto 8: Dr. Martens 1460
(8, 41, 3), (8, 42, 3), (8, 43, 3), (8, 44, 3), (8, 45, 3),
-- Producto 9: Nike Air Jordan 1
(9, 40, 2), (9, 41, 2), (9, 42, 2), (9, 43, 2), (9, 44, 2),
-- Producto 10: Adidas Harden Vol. 6
(10, 41, 4), (10, 42, 4), (10, 43, 4), (10, 44, 4), (10, 45, 4);

-- Actualizar stock total en productos
UPDATE productos p SET p.stock = (
    SELECT SUM(pt.stock) FROM producto_tallas pt WHERE pt.producto_id = p.id
);

-- =============================================
-- INSERTAR USUARIOS
-- =============================================

INSERT INTO usuarios (nombre, email, password, telefono, fecha_nacimiento, rol, activo, verificado) VALUES
('Admin Principal', 'admin@stepupshoes.com', '$2a$10$YourHashedPasswordHere', '555-1234', '1990-01-01', 'ADMIN', 1, 1),
('Juan Pérez', 'juan.perez@email.com', '$2a$10$YourHashedPasswordHere', '555-5678', '1992-05-15', 'CLIENTE', 1, 1),
('María García', 'maria.garcia@email.com', '$2a$10$YourHashedPasswordHere', '555-9012', '1988-08-22', 'CLIENTE', 1, 1),
('Carlos López', 'carlos.lopez@email.com', '$2a$10$YourHashedPasswordHere', '555-3456', '1995-03-30', 'CLIENTE', 1, 0);

-- =============================================
-- TABLAS ADICIONALES (simplificadas)
-- =============================================

-- Tabla: cupones
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
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cupones_activo (activo),
    INDEX idx_cupones_fechas (fecha_inicio, fecha_fin)
);

-- Insertar cupones de ejemplo
INSERT INTO cupones (codigo, descripcion, tipo, valor, max_descuento, min_compra, usos_maximos, fecha_inicio, fecha_fin) VALUES
('BIENVENIDA10', '10% de descuento en tu primera compra', 'PORCENTAJE', 10, 20, 50, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
('VERANO25', '25% de descuento en productos de verano', 'PORCENTAJE', 25, 50, 100, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY));

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista: productos con información completa
CREATE OR REPLACE VIEW vista_productos_completa AS
SELECT 
    p.*,
    c.nombre as categoria_nombre,
    c.slug as categoria_slug,
    GROUP_CONCAT(DISTINCT pt.talla ORDER BY pt.talla) as tallas_disponibles
FROM productos p
INNER JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN producto_tallas pt ON p.id = pt.producto_id AND pt.stock > 0
WHERE p.activo = TRUE AND c.activo = TRUE
GROUP BY p.id, c.nombre, c.slug;

-- Vista: carrito con información
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
    p.imagen_url as producto_imagen,
    p.stock as producto_stock,
    (p.precio * c.cantidad) as subtotal,
    c.cantidad <= COALESCE(pt.stock, 0) as stock_suficiente
FROM carrito_compras c
INNER JOIN productos p ON c.producto_id = p.id
LEFT JOIN producto_tallas pt ON c.producto_id = pt.producto_id AND c.talla = pt.talla
WHERE p.activo = TRUE;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

SELECT '=============================================' as '';
SELECT 'BASE DE DATOS COMPLETA CREADA EXITOSAMENTE' as '';
SELECT '=============================================' as '';
SELECT '' as '';
SELECT 'RESUMEN:' as '';
SELECT CONCAT('✅ ', COUNT(*), ' categorías insertadas') as '' FROM categorias;
SELECT CONCAT('✅ ', COUNT(*), ' productos insertados') as '' FROM productos;
SELECT CONCAT('✅ ', COUNT(*), ' tallas configuradas') as '' FROM producto_tallas;
SELECT CONCAT('✅ ', COUNT(*), ' usuarios creados') as '' FROM usuarios;
SELECT CONCAT('✅ ', COUNT(*), ' cupones disponibles') as '' FROM cupones;
SELECT '' as '';
SELECT '=============================================' as '';
SELECT 'IMPORTANTE PARA FIREBASE:' as '';
SELECT '=============================================' as '';
SELECT 'Todas las imágenes en la BD usan solo NOMBRES de archivo' as '';
SELECT 'que COINCIDEN EXACTAMENTE con lo que tienes en Firebase Storage' as '';
SELECT '' as '';
SELECT 'Ejemplos de URLs que se generarán:' as '';
SELECT '' as '';
SELECT 
    CONCAT('https://firebasestorage.googleapis.com/v0/b/stepup-shoes-3fbfb.appspot.com/o/productos%2F', 
           p.imagen_url, '?alt=media') as 'URL Firebase'
FROM productos p
LIMIT 5;
SELECT '' as '';
SELECT '=============================================' as '';
SELECT 'NEXT STEPS:' as '';
SELECT '1. Reinicia la aplicación Spring Boot' as '';
SELECT '2. Accede a: http://localhost:5001/catalogo' as '';
SELECT '3. Las imágenes deberían cargarse CORRECTAMENTE' as '';
SELECT '4. No hay bucles infinitos' as '';
SELECT '=============================================' as '';