/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.controller;

import com.stepup.shoes.model.Producto;
import com.stepup.shoes.service.ProductoService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/carrito")
public class CarritoController {

    @Autowired
    private ProductoService productoService;

    @PostMapping("/agregar")
    @ResponseBody
    public Map<String, Object> agregarAlCarrito(
            @RequestParam Long productoId,
            @RequestParam Integer talla,
            @RequestParam Integer cantidad,
            HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Verificar autenticación
        if (session.getAttribute("usuarioId") == null) {
            response.put("success", false);
            response.put("message", "Debes iniciar sesión para agregar productos al carrito");
            return response;
        }
        
        // Obtener producto
        Producto producto = productoService.findById(productoId);
        if (producto == null) {
            response.put("success", false);
            response.put("message", "Producto no encontrado");
            return response;
        }
        
        // Verificar stock
        if (producto.getStock() < cantidad) {
            response.put("success", false);
            response.put("message", "Stock insuficiente");
            return response;
        }
        
        // Obtener carrito de la sesión
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        
        // Verificar si el producto ya está en el carrito con la misma talla
        boolean encontrado = false;
        for (Map<String, Object> item : carrito) {
            if (item.get("productoId").equals(productoId) && item.get("talla").equals(talla)) {
                int nuevaCantidad = (Integer) item.get("cantidad") + cantidad;
                if (nuevaCantidad > 5) { // Máximo 5 unidades por producto
                    response.put("success", false);
                    response.put("message", "Máximo 5 unidades por producto");
                    return response;
                }
                item.put("cantidad", nuevaCantidad);
                encontrado = true;
                break;
            }
        }
        
        // Si no se encontró, agregar nuevo item
        if (!encontrado) {
            Map<String, Object> nuevoItem = new HashMap<>();
            nuevoItem.put("productoId", productoId);
            nuevoItem.put("nombre", producto.getNombre());
            nuevoItem.put("precio", producto.getPrecio());
            nuevoItem.put("imagen", producto.getImagenUrl());
            nuevoItem.put("talla", talla);
            nuevoItem.put("cantidad", cantidad);
            nuevoItem.put("stock", producto.getStock());
            carrito.add(nuevoItem);
        }
        
        // Guardar carrito en sesión
        session.setAttribute("carrito", carrito);
        
        response.put("success", true);
        response.put("message", "Producto agregado al carrito");
        response.put("carritoCount", carrito.size());
        return response;
    }

    @GetMapping("/ver")
    public String verCarrito(Model model, HttpSession session) {
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        model.addAttribute("carrito", carrito);
        model.addAttribute("titulo", "Carrito de Compras - StepUp Shoes");
        
        // Calcular totales
        double subtotal = calcularSubtotal(carrito);
        double envio = subtotal >= 100 ? 0 : 10;
        double total = subtotal + envio;
        
        model.addAttribute("subtotal", subtotal);
        model.addAttribute("envio", envio);
        model.addAttribute("total", total);
        
        return "carrito";
    }

    @PostMapping("/actualizar")
    @ResponseBody
    public Map<String, Object> actualizarCantidad(
            @RequestParam int index,
            @RequestParam int cambio,
            HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        
        if (index >= 0 && index < carrito.size()) {
            Map<String, Object> item = carrito.get(index);
            int nuevaCantidad = (Integer) item.get("cantidad") + cambio;
            
            if (nuevaCantidad < 1) {
                // Eliminar item si la cantidad es 0
                carrito.remove(index);
            } else if (nuevaCantidad > 5) {
                response.put("success", false);
                response.put("message", "Máximo 5 unidades por producto");
                return response;
            } else if (nuevaCantidad > (Integer) item.get("stock")) {
                response.put("success", false);
                response.put("message", "Stock insuficiente");
                return response;
            } else {
                item.put("cantidad", nuevaCantidad);
            }
            
            session.setAttribute("carrito", carrito);
            response.put("success", true);
            response.put("carritoCount", carrito.size());
        } else {
            response.put("success", false);
            response.put("message", "Ítem no encontrado en el carrito");
        }
        
        return response;
    }

    @PostMapping("/eliminar")
    @ResponseBody
    public Map<String, Object> eliminarDelCarrito(
            @RequestParam int index,
            HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        
        if (index >= 0 && index < carrito.size()) {
            carrito.remove(index);
            session.setAttribute("carrito", carrito);
            response.put("success", true);
            response.put("message", "Producto eliminado del carrito");
            response.put("carritoCount", carrito.size());
        } else {
            response.put("success", false);
            response.put("message", "Ítem no encontrado en el carrito");
        }
        
        return response;
    }

    @PostMapping("/vaciar")
    @ResponseBody
    public Map<String, Object> vaciarCarrito(HttpSession session) {
        session.removeAttribute("carrito");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Carrito vaciado");
        response.put("carritoCount", 0);
        
        return response;
    }

    @GetMapping("/contador")
    @ResponseBody
    public Map<String, Object> obtenerContadorCarrito(HttpSession session) {
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", carrito.size());
        response.put("totalItems", carrito.stream()
                .mapToInt(item -> (Integer) item.get("cantidad"))
                .sum());
        
        return response;
    }

    // Métodos auxiliares
    private List<Map<String, Object>> obtenerCarrito(HttpSession session) {
        List<Map<String, Object>> carrito = (List<Map<String, Object>>) session.getAttribute("carrito");
        if (carrito == null) {
            carrito = new ArrayList<>();
        }
        return carrito;
    }

    private double calcularSubtotal(List<Map<String, Object>> carrito) {
        return carrito.stream()
                .mapToDouble(item -> (Double) item.get("precio") * (Integer) item.get("cantidad"))
                .sum();
    }
}
