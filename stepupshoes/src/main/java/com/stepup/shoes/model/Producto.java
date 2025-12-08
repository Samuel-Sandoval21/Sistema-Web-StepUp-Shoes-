package com.stepup.shoes.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nombre;
    
    @Column(length = 1000)
    private String descripcion;
    
    @Column(nullable = false)
    private Double precio;
    
    private Double precioOriginal;
    
    private Integer stock;
    
    private String imagenUrl;  // Puede ser: "nombre.jpg" o "/images/nombre.jpg" o "/images/carpeta/nombre.jpg"
    
    private Boolean destacado = false;
    
    private Boolean activo = true;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;
    
    @ElementCollection
    @CollectionTable(name = "producto_tallas", joinColumns = @JoinColumn(name = "producto_id"))
    @Column(name = "talla")
    private List<Integer> tallasDisponibles;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion = LocalDateTime.now();
    
    // ✅ NUEVO MÉTODO MEJORADO: Obtener ruta completa de la imagen
    public String getRutaImagenCompleta() {
        if (imagenUrl == null || imagenUrl.isEmpty()) {
            return "/images/default.jpg";  // Imagen por defecto si no hay imagen
        }
        
        // CASO 1: Si ya es una ruta completa que empieza con /images/
        if (imagenUrl.startsWith("/images/")) {
            String[] partes = imagenUrl.split("/");
            
            // Ejemplo: /images/20_off.jpg → ["", "images", "20_off.jpg"]
            if (partes.length == 3) {
                // Solo tiene /images/nombre.jpg → necesita subcarpeta
                String subcarpeta = determinarSubcarpeta();
                String nombreArchivo = partes[2];
                return "/images/" + subcarpeta + "/" + nombreArchivo;
            } 
            // Ejemplo: /images/promos/20_off.jpg → ya está completo
            else if (partes.length >= 4) {
                return imagenUrl; // Ya tiene estructura completa con subcarpeta
            }
        }
        
        // CASO 2: Si solo es nombre de archivo (ej: "20_off.jpg")
        // CASO 3: Si es otra cosa (ruta antigua o formato diferente)
        String subcarpeta = determinarSubcarpeta();
        return "/images/" + subcarpeta + "/" + extraerNombreArchivo(imagenUrl);
    }
    
    // ✅ Método auxiliar: Extraer solo el nombre del archivo de cualquier ruta
    private String extraerNombreArchivo(String ruta) {
        if (ruta == null || ruta.isEmpty()) {
            return "default.jpg";
        }
        
        // Si tiene barras, extraer la última parte
        if (ruta.contains("/")) {
            String[] partes = ruta.split("/");
            return partes[partes.length - 1];
        }
        
        // Si no tiene barras, es ya el nombre del archivo
        return ruta;
    }
    
    // ✅ Determinar subcarpeta según categoría
    private String determinarSubcarpeta() {
        if (categoria == null || categoria.getNombre() == null) {
            return "otros";  // Carpeta por defecto si no hay categoría
        }
        
        String nombreCategoria = categoria.getNombre().toLowerCase();
        
        // Mapeo de categorías a subcarpetas
        return switch (nombreCategoria) {
            case "deportivas", "deportivo", "skechers" -> "deportivas";
            case "casual", "vans", "converse" -> "casual";
            case "formal", "formales", "oxford", "derby", "loafer", "monk" -> "formal";
            case "crocs" -> "crocs";
            case "promociones", "promos", "ofertas", "banners" -> "promos";
            default -> "otros";
        };
    }
    
    // ✅ Método para debug: Ver qué ruta se está generando
    public String getInfoRutaImagen() {
        if (imagenUrl == null) return "imagenUrl es null";
        
        String resultado = "Original: " + imagenUrl + "\n";
        resultado += "Nombre archivo extraído: " + extraerNombreArchivo(imagenUrl) + "\n";
        resultado += "Subcarpeta determinada: " + determinarSubcarpeta() + "\n";
        resultado += "Ruta completa: " + getRutaImagenCompleta();
        
        return resultado;
    }
    
    // ✅ Método para actualizar fecha de modificación automáticamente
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    // ✅ Método estático para limpiar ruta (si necesitas limpiar la BD después)
    public static String limpiarRutaImagen(String rutaCompleta) {
        if (rutaCompleta == null || rutaCompleta.isEmpty()) {
            return "";
        }
        
        // Quitar /images/ si está al inicio
        if (rutaCompleta.startsWith("/images/")) {
            rutaCompleta = rutaCompleta.substring(8); // Quita "/images/"
        }
        
        // Extraer solo el nombre del archivo (última parte después de /)
        String[] partes = rutaCompleta.split("/");
        return partes[partes.length - 1];
    }
}