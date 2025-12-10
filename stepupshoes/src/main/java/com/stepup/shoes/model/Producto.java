package com.stepup.shoes.model;

import jakarta.persistence.*;
import lombok.Data;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
    
    private String imagenUrl;  // Solo nombre de archivo: "nike-air-max-270.jpg"
    
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
    
    // ✅ MÉTODO PRINCIPAL CORREGIDO: Obtener URL completa de Firebase
    public String getRutaImagenCompleta() {
        // Si no hay imagen, retornar placeholder
        if (imagenUrl == null || imagenUrl.trim().isEmpty()) {
            return "https://via.placeholder.com/300x200?text=Sin+Imagen";
        }
        
        // Si ya es URL completa (de Firebase u otro), retornarla
        if (imagenUrl.startsWith("http://") || imagenUrl.startsWith("https://")) {
            return imagenUrl;
        }
        
        // Si es solo nombre de archivo (como en tu BD), construir URL de Firebase
        return construirUrlFirebase(imagenUrl);
    }
    
    // ✅ Método auxiliar: Construir URL de Firebase
    private String construirUrlFirebase(String nombreArchivo) {
        try {
            // Carpeta donde están las imágenes en Firebase Storage
            String carpetaFirebase = "productos";
            
            // Codificar la ruta para URL: productos/nombreArchivo.jpg
            String rutaCodificada = URLEncoder.encode(
                carpetaFirebase + "/" + nombreArchivo, 
                StandardCharsets.UTF_8.toString()
            ).replace("+", "%20"); // Reemplazar espacios correctamente
            
            // Construir URL pública de Firebase
            return String.format(
                "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                "stepup-shoes-3fbfb.appspot.com",  // Nombre correcto del bucket
                rutaCodificada
            );
            
        } catch (Exception e) {
            // Para debug en consola
            System.err.println("❌ Error construyendo URL Firebase para: " + nombreArchivo);
            e.printStackTrace();
            
            // Retornar placeholder en caso de error
            return "https://via.placeholder.com/300x200?text=Error+URL";
        }
    }
    
    // ✅ Método para debug: Ver información completa de la imagen
    public String getInfoRutaImagen() {
        StringBuilder info = new StringBuilder();
        info.append("=== DEBUG IMAGEN ===\n");
        info.append("ID Producto: ").append(id).append("\n");
        info.append("Nombre: ").append(nombre).append("\n");
        info.append("imagenUrl (BD): ").append(imagenUrl).append("\n");
        info.append("Ruta Firebase: ").append(getRutaImagenCompleta()).append("\n");
        info.append("Categoría: ").append(categoria != null ? categoria.getNombre() : "null");
        return info.toString();
    }
    
    // ✅ Método estático para validar URLs
    public static boolean esUrlValida(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        return url.startsWith("http://") || url.startsWith("https://");
    }
    
    // ✅ Método para actualizar fecha automáticamente
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    // ✅ Método para inicializar fechas
    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }
}