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

    // ⭐ IMPORTANTE: ESTA URL VIENE DE FIREBASE
    private String imagenUrl;

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

    // =====================================================
    // ⭐ MÉTODO SIMPLE Y CORRECTO: Imagen Firebase o default
    // =====================================================
    public String getRutaImagenCompleta() {

        // Si no hay imagen → imagen default
        if (imagenUrl == null || imagenUrl.isBlank()) {
            return "/images/default.jpg";
        }

        // Si la URL apunta a Firebase (https://firebasestorage...)
        if (imagenUrl.startsWith("http://") || imagenUrl.startsWith("https://")) {
            return imagenUrl;
        }

        // Si por alguna razón se guardó solo el nombre
 if (!imagenUrl.startsWith("http")) {
        // Generar URL pública de Firebase
        try {
            String encodedFileName = java.net.URLEncoder.encode(imagenUrl, "UTF-8");
            return String.format(
                "https://firebasestorage.googleapis.com/v0/b/stepup-shoes-3fbfb.appspot.com/o/productos%%2F%s?alt=media",
                encodedFileName
            );
        } catch (Exception e) {
            return "https://via.placeholder.com/300x220/CCCCCC/666666?text=Error+Imagen";
        }
    }
    
    return imagenUrl;
}

// ✅ AÑADE este método para diagnóstico
public String getTipoImagen() {
    if (imagenUrl == null) return "NULL";
    if (imagenUrl.startsWith("https://firebasestorage")) return "FIREBASE";
    if (imagenUrl.startsWith("http")) return "EXTERNAL";
    return "LOCAL_FILE";
}
    // Actualiza fecha automáticamente
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}