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

        List<Producto> productos = aplicarFiltrosYOrdenamiento(categoria, rangoPrecio, orden);
        
        // ✅ DEBUG: Mostrar URLs generadas en consola
        System.out.println("\n=== DEBUG FIREBASE IMAGES ===");
        System.out.println("Total productos: " + productos.size());
        for (Producto p : productos) {
            System.out.println("ID: " + p.getId() + 
                             " | Nombre: " + p.getNombre() + 
                             " | imagenUrl: '" + p.getImagenUrl() + "'" +
                             " | Ruta Firebase: " + p.getRutaImagenCompleta());
        }
        System.out.println("=== FIN DEBUG ===\n");

        model.addAttribute("productos", productos);
        model.addAttribute("categorias", categoriaService.findAll());
        model.addAttribute("categoriaSeleccionada", categoria);
        model.addAttribute("precioSeleccionado", rangoPrecio);
        model.addAttribute("ordenSeleccionado", orden);
        model.addAttribute("titulo", "Catálogo - StepUp Shoes");

        return "catalogo";
    }

    @GetMapping("/producto/{id}")
    public String verProducto(@PathVariable Long id, Model model) {
        Producto producto = productoService.findById(id);
        if (producto == null) return "redirect:/catalogo";
        
        // ✅ DEBUG para producto individual
        System.out.println("\n=== DEBUG PRODUCTO INDIVIDUAL ===");
        System.out.println(producto.getInfoRutaImagen());
        System.out.println("=== FIN DEBUG ===\n");

        model.addAttribute("producto", producto);
        return "producto-detalle";
    }

    private List<Producto> aplicarFiltrosYOrdenamiento(String categoria, String rangoPrecio, String orden) {
        List<Producto> productos = productoService.findAll();

        // FILTRAR CATEGORÍA
        if (categoria != null && !categoria.isEmpty()) {
            productos = productos.stream()
                    .filter(p -> p.getCategoria() != null && 
                                 p.getCategoria().getNombre().equalsIgnoreCase(categoria))
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
                    .filter(p -> p.getPrecio() != null && p.getPrecio() >= r[0] && p.getPrecio() <= r[1])
                    .collect(Collectors.toList());
        }

        // ORDENAMIENTO
        if (orden != null && !orden.isEmpty()) {
            productos = switch (orden) {
                case "precio-asc" ->
                    productos.stream()
                            .sorted(Comparator.comparing(Producto::getPrecio, 
                                    Comparator.nullsLast(Comparator.naturalOrder())))
                            .toList();

                case "precio-desc" ->
                    productos.stream()
                            .sorted(Comparator.comparing(Producto::getPrecio, 
                                    Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                            .toList();

                case "nombre-asc" ->
                    productos.stream()
                            .sorted(Comparator.comparing(Producto::getNombre, 
                                    Comparator.nullsLast(Comparator.naturalOrder())))
                            .toList();

                default -> productos;
            };
        }

        return productos;
    }
}