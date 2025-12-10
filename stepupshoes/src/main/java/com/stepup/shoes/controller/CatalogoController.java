package com.stepup.shoes.controller;

import com.stepup.shoes.model.Categoria;
import com.stepup.shoes.model.Producto;
import com.stepup.shoes.service.CategoriaService;
import com.stepup.shoes.service.ProductoService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/catalogo")
public class CatalogoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private CategoriaService categoriaService;

@GetMapping
public String mostrarCatalogo(
        @RequestParam(required = false) String categoria,
        @RequestParam(required = false) String rangoPrecio,
        @RequestParam(required = false) String orden,
        Model model) {

    System.out.println("🔍 DEBUG: Iniciando mostrarCatalogo");
    
    // Obtener productos
    List<Producto> productos = aplicarFiltrosYOrdenamiento(categoria, rangoPrecio, orden);
    
    // ✅ DIAGNÓSTICO DETALLADO
    System.out.println("📊 Total productos: " + productos.size());
    int firebaseCount = 0, localCount = 0, nullCount = 0;
    
    for (Producto p : productos) {
        System.out.println("➡ Producto: " + p.getNombre() + 
                         " | URL: " + p.getImagenUrl() +
                         " | Ruta: " + p.getRutaImagenCompleta() +
                         " | Tipo: " + p.getTipoImagen());
        
        if (p.getImagenUrl() == null) nullCount++;
        else if (p.getImagenUrl().contains("firebasestorage")) firebaseCount++;
        else localCount++;
    }
    
    System.out.println("📊 Resumen - Firebase: " + firebaseCount + 
                     " | Local: " + localCount + " | Null: " + nullCount);
    
    model.addAttribute("productos", productos);
    model.addAttribute("categorias", categoriaService.findAll());
    model.addAttribute("titulo", "Catálogo");
    
    // ✅ AGREGAR variable para saber si usar Firebase
    model.addAttribute("usarFirebase", true); // Cambia a false para probar sin Firebase
    
    return "catalogo";
}

    @GetMapping("/producto/{id}")
    public String verProducto(@PathVariable Long id, Model model) {

        Producto producto = productoService.findById(id);
        if (producto == null) return "redirect:/catalogo";

        model.addAttribute("producto", producto);

        return "producto-detalle";
    }

    private List<Producto> aplicarFiltrosYOrdenamiento(String categoria, String rangoPrecio, String orden) {

        List<Producto> productos = productoService.findAll();

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
