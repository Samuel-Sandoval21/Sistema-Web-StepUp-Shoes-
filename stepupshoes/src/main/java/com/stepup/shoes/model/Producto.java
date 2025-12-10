package com.stepup.shoes.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

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
// ⭐ MÉTODO CORREGIDO: Imagen Firebase o default
// =====================================================
public String getRutaImagenCompleta() {
    // Si no hay imagen → placeholder SVG (sin parpadeo)
    if (imagenUrl == null || imagenUrl.isBlank()) {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='220'%3E%3Crect width='300' height='220' fill='%23f8f9fa'/%3E%3C/svg%3E";
    }

    String raw = imagenUrl.trim();

    // If already a local images path, normalize and return
    if (raw.startsWith("/images/") || raw.startsWith("/static/images/") || raw.startsWith("images/")) {
        return raw.startsWith("/") ? raw : ("/" + raw);
    }

    try {
        String path = raw;

        // Firebase storage URLs: object path is typically after '/o/' and percent-encoded
        if (path.contains("/o/")) {
            int idx = path.indexOf("/o/");
            path = path.substring(idx + 3);
        } else if (path.contains("://")) {
            // remove scheme and host
            int idx = path.indexOf("://");
            path = path.substring(idx + 3);
            int slash = path.indexOf('/');
            if (slash >= 0) path = path.substring(slash + 1);
        }

        // Decode percent-encoded segments (Firebase uses encoding)
        try {
            path = java.net.URLDecoder.decode(path, "UTF-8");
        } catch (java.io.UnsupportedEncodingException ignore) {
        }

        // Strip query params
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);

        // Remove any leading slashes
        while (path.startsWith("/")) path = path.substring(1);

        // Prevent traversal
        path = path.replace("..", "");

        // Normalize spaces
        path = path.replaceAll("\\s+", "_");

        // If final segment lacks an extension, add .jpg
        int lastSlash = path.lastIndexOf('/');
        String lastSeg = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        if (!lastSeg.contains(".")) {
            path = path + ".jpg";
        }

        // Ensure path is rooted under images/
        if (!path.startsWith("images/")) {
            path = "images/" + path;
        }

        return "/" + path;

    } catch (Exception e) {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='220'%3E%3Crect width='300' height='220' fill='%23ffebee'/%3E%3Ctext x='150' y='110' font-family='Arial' font-size='12' fill='%23c62828' text-anchor='middle'%3EError en imagen%3C/text%3E%3C/svg%3E";
    }
}

// ✅ AÑADE este método para diagnóstico
public String getDebugImagenInfo() {
    if (imagenUrl == null) return "NULL";
    
    if (imagenUrl.startsWith("https://firebasestorage.googleapis.com")) {
        return "FIREBASE_URL";
    } else if (imagenUrl.startsWith("http")) {
        return "EXTERNAL_URL";
    } else if (imagenUrl.contains(".")) {
        return "ARCHIVO_CON_EXTENSION: " + imagenUrl;
    } else {
        return "ARCHIVO_SIN_EXTENSION: " + imagenUrl;
    }
}
}
