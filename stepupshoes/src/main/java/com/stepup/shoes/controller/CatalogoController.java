package com.stepup.shoes.controller;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.stepup.shoes.model.Producto;
import com.stepup.shoes.service.CategoriaService;
import com.stepup.shoes.service.ProductoService;

@Controller
public class CatalogoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private CategoriaService categoriaService;

    @GetMapping("/catalogo")
    public String mostrarCatalogo(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String rangoPrecio,
            @RequestParam(required = false) String orden,
            @RequestParam(required = false) String busqueda,
            Model model) {

        System.out.println("🔍 DEBUG: Iniciando mostrarCatalogo");
        
        // Obtener productos
        List<Producto> productos = aplicarFiltrosYOrdenamiento(categoria, rangoPrecio, orden, busqueda);
        
        // ✅ DIAGNÓSTICO DETALLADO
        System.out.println("📊 Total productos: " + productos.size());
        int firebaseCount = 0, localCount = 0, nullCount = 0, archivoCount = 0;
        
        for (Producto p : productos) {
            String debugInfo;
            
            // Obtener información de debug de manera segura
            if (p.getImagenUrl() == null) {
                debugInfo = "NULL";
                nullCount++;
            } else if (p.getImagenUrl().startsWith("https://firebasestorage.googleapis.com")) {
                debugInfo = "FIREBASE";
                firebaseCount++;
            } else if (p.getImagenUrl().startsWith("http")) {
                debugInfo = "EXTERNAL";
                localCount++;
            } else {
                debugInfo = "ARCHIVO";
                archivoCount++;
            }
            
            System.out.println("➡ Producto: " + p.getNombre() + 
                             " | URL: " + p.getImagenUrl() +
                             " | Ruta: " + p.getRutaImagenCompleta() +
                             " | Tipo: " + debugInfo);
        }
        
        System.out.println("📊 Resumen - Firebase: " + firebaseCount + 
                         " | Archivo: " + archivoCount + 
                         " | Externo: " + localCount + 
                         " | Null: " + nullCount);
        
        model.addAttribute("productos", productos);
        model.addAttribute("categorias", categoriaService.findAll());
        model.addAttribute("titulo", "Catálogo");
        
        return "catalogo";
    }

    @GetMapping("/producto/{id}")
    public String verProducto(@PathVariable Long id, Model model) {

        Producto producto = productoService.findById(id);
        if (producto == null) return "redirect:/catalogo";

        model.addAttribute("producto", producto);

        return "producto-detalle";
    }

    private List<Producto> aplicarFiltrosYOrdenamiento(String categoria, String rangoPrecio, String orden, String busqueda) {

        List<Producto> productos = productoService.findAll();

        // FILTRAR POR BÚSQUEDA
        if (busqueda != null && !busqueda.isEmpty()) {
            String termino = busqueda.toLowerCase().trim();
            productos = productos.stream()
                    .filter(p -> p.getNombre().toLowerCase().contains(termino) || 
                               (p.getDescripcion() != null && p.getDescripcion().toLowerCase().contains(termino)))
                    .collect(Collectors.toList());
        }

        // FILTRAR CATEGORÍA
        if (categoria != null && !categoria.isEmpty()) {
            productos = productos.stream()
                    .filter(p -> p.getCategoria().getNombre().equalsIgnoreCase(categoria))
                    .collect(Collectors.toList());
        }

        // FILTRAR PRECIO
        if (rangoPrecio != null && !rangoPrecio.isEmpty()) {
            Double[] r = switch (rangoPrecio) {
                case "0-50" -> new Double[]{0.0, 50.0};
                case "50-100" -> new Double[]{50.0, 100.0};
                case "100+" -> new Double[]{100.0, 999999.0};
                default -> new Double[]{0.0, 999999.0};
            };

            productos = productos.stream()
                    .filter(p -> p.getPrecio() >= r[0] && p.getPrecio() <= r[1])
                    .collect(Collectors.toList());
        }

        // ORDENAMIENTO
        if (orden != null && !orden.isEmpty()) {
            productos = switch (orden) {
                case "precio-asc" ->
                        productos.stream().sorted(Comparator.comparing(Producto::getPrecio)).toList();

                case "precio-desc" ->
                        productos.stream().sorted(Comparator.comparing(Producto::getPrecio).reversed()).toList();

                case "nombre-asc" ->
                        productos.stream().sorted(Comparator.comparing(Producto::getNombre)).toList();

                default -> productos;
            };
        }

        return productos;
    }
}
