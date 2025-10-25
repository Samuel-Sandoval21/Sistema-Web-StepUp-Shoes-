/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
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
        List<Categoria> categorias = categoriaService.findAll();
        
        model.addAttribute("productos", productos);
        model.addAttribute("categorias", categorias);
        model.addAttribute("categoriaSeleccionada", categoria);
        model.addAttribute("rangoPrecioSeleccionado", rangoPrecio);
        model.addAttribute("ordenSeleccionado", orden);
        model.addAttribute("titulo", "Nuestro Catálogo - StepUp Shoes");
        
        return "catalogo";
    }

    private List<Producto> aplicarFiltrosYOrdenamiento(String categoria, String rangoPrecio, String orden) {
        List<Producto> productos;
        
        // Aplicar filtros
        if (categoria != null && !categoria.isEmpty()) {
            if (rangoPrecio != null && !rangoPrecio.isEmpty()) {
                Double[] precios = parseRangoPrecio(rangoPrecio);
                productos = productoService.findByCategoriaAndPrecioBetween(categoria, precios[0], precios[1]);
            } else {
                productos = productoService.findByCategoriaNombre(categoria);
            }
        } else if (rangoPrecio != null && !rangoPrecio.isEmpty()) {
            Double[] precios = parseRangoPrecio(rangoPrecio);
            productos = productoService.findByPrecioBetween(precios[0], precios[1]);
        } else {
            productos = productoService.findAll();
        }
        
        // Aplicar ordenamiento
        if (orden != null && !orden.isEmpty()) {
            productos = aplicarOrdenamiento(productos, orden);
        }
        
        return productos;
    }

    private Double[] parseRangoPrecio(String rangoPrecio) {
        return switch (rangoPrecio) {
            case "menos-50" -> new Double[]{0.0, 49.99};
            case "50-100" -> new Double[]{50.0, 100.0};
            case "100-150" -> new Double[]{100.01, 150.0};
            case "150-200" -> new Double[]{150.01, 200.0};
            default -> new Double[]{0.0, 10000.0};
        };
    }

    private List<Producto> aplicarOrdenamiento(List<Producto> productos, String orden) {
        return switch (orden) {
            case "precio-asc" -> productos.stream()
                    .sorted(Comparator.comparing(Producto::getPrecio))
                    .collect(Collectors.toList());
            case "precio-desc" -> productos.stream()
                    .sorted(Comparator.comparing(Producto::getPrecio).reversed())
                    .collect(Collectors.toList());
            case "nombre-asc" -> productos.stream()
                    .sorted(Comparator.comparing(Producto::getNombre))
                    .collect(Collectors.toList());
            default -> productos;
        };
    }

    @GetMapping("/buscar")
    public String buscarProductos(@RequestParam String q, Model model) {
        List<Producto> productos = productoService.buscarPorTermino(q);
        model.addAttribute("productos", productos);
        model.addAttribute("terminoBusqueda", q);
        model.addAttribute("titulo", "Resultados de búsqueda: " + q);
        return "catalogo";
    }
}
