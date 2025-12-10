/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.stepup.shoes.model.DetallePedido;
import com.stepup.shoes.model.Pedido;
import com.stepup.shoes.model.Usuario;
import com.stepup.shoes.service.PedidoService;
import com.stepup.shoes.service.UsuarioService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/checkout")
public class CheckoutController {

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public String mostrarCheckout(Model model, HttpSession session) {
        // Verificar autenticación
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        // Verificar que el carrito no esté vacío
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        if (carrito.isEmpty()) {
            return "redirect:/carrito/ver";
        }

        // Obtener información del usuario
        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        Usuario usuario = usuarioOpt.get();

        // Calcular totales
        double subtotal = calcularSubtotal(carrito);
        double envio = subtotal >= 100 ? 0 : 10;
        double total = subtotal + envio;

        model.addAttribute("usuario", usuario);
        model.addAttribute("carrito", carrito);
        model.addAttribute("subtotal", subtotal);
        model.addAttribute("envio", envio);
        model.addAttribute("total", total);
        model.addAttribute("titulo", "Checkout - StepUp Shoes");

        return "checkout";
    }

    @PostMapping("/procesar")
    public String procesarPedido(
            @RequestParam String nombreCompleto,
            @RequestParam String email,
            @RequestParam String telefono,
            @RequestParam String direccion,
            @RequestParam String ciudad,
            @RequestParam String estado,
            @RequestParam String codigoPostal,
            @RequestParam String metodoEnvio,
            @RequestParam String metodoPago,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        // Verificar autenticación
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        // Verificar carrito
        List<Map<String, Object>> carrito = obtenerCarrito(session);
        if (carrito.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "El carrito está vacío");
            return "redirect:/carrito/ver";
        }

        // Obtener usuario
        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        try {
            // Crear pedido
            Pedido pedido = new Pedido();
            pedido.setUsuario(usuarioOpt.get());
            pedido.setNumeroPedido(generarNumeroPedido());
            pedido.setTotal(calcularTotal(carrito, metodoEnvio));
            pedido.setEstado(Pedido.EstadoPedido.PENDIENTE);
            pedido.setFechaCreacion(LocalDateTime.now());

            // Crear detalles del pedido
            List<DetallePedido> detalles = new ArrayList<>();
            for (Map<String, Object> item : carrito) {
                DetallePedido detalle = new DetallePedido();
                detalle.setPedido(pedido);
                
                // En una implementación real, aquí se obtendría el producto de la base de datos
                // Por ahora usamos datos del carrito
                detalle.setCantidad((Integer) item.get("cantidad"));
                detalle.setPrecio((Double) item.get("precio"));
                detalle.setTalla((Integer) item.get("talla"));
                
                detalles.add(detalle);
            }
            pedido.setDetalles(detalles);

            // Guardar pedido
            Pedido pedidoGuardado = pedidoService.save(pedido);

            // Limpiar carrito
            session.removeAttribute("carrito");

            // Preparar datos para la confirmación
            redirectAttributes.addFlashAttribute("pedido", pedidoGuardado);
            redirectAttributes.addFlashAttribute("nombreCliente", nombreCompleto);
            redirectAttributes.addFlashAttribute("direccionEnvio", direccion + ", " + ciudad + ", " + estado);
            redirectAttributes.addFlashAttribute("metodoEnvio", metodoEnvio);
            redirectAttributes.addFlashAttribute("metodoPago", metodoPago);

            return "redirect:/checkout/confirmacion";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al procesar el pedido: " + e.getMessage());
            return "redirect:/checkout";
        }
    }

    @GetMapping("/confirmacion")
    public String mostrarConfirmacion(Model model, HttpSession session) {
        // Verificar que hay un pedido en los flash attributes
        if (!model.containsAttribute("pedido")) {
            return "redirect:/";
        }

        model.addAttribute("titulo", "Confirmación de Pedido - StepUp Shoes");
        return "confirmacion-pedido";
    }

    @GetMapping("/pedidos")
    public String verPedidos(Model model, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        List<Pedido> pedidos = pedidoService.findByUsuario(usuarioOpt.get());
        model.addAttribute("pedidos", pedidos);
        model.addAttribute("titulo", "Mis Pedidos - StepUp Shoes");

        return "mis-pedidos";
    }

    @GetMapping("/pedido/{id}")
    public String verDetallePedido(@PathVariable Long id, Model model, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Pedido> pedidoOpt = pedidoService.findById(id);
        if (pedidoOpt.isEmpty()) {
            return "redirect:/checkout/pedidos";
        }

        Pedido pedido = pedidoOpt.get();
        
        // Verificar que el pedido pertenece al usuario
        if (!pedido.getUsuario().getId().equals(usuarioId)) {
            return "redirect:/checkout/pedidos";
        }

        model.addAttribute("pedido", pedido);
        model.addAttribute("titulo", "Pedido #" + pedido.getNumeroPedido() + " - StepUp Shoes");

        return "detalle-pedido";
    }

    // Métodos auxiliares
    private List<Map<String, Object>> obtenerCarrito(HttpSession session) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> carrito = (List<Map<String, Object>>) session.getAttribute("carrito");
        return carrito != null ? carrito : new ArrayList<>();
    }

    private double calcularSubtotal(List<Map<String, Object>> carrito) {
        return carrito.stream()
                .mapToDouble(item -> (Double) item.get("precio") * (Integer) item.get("cantidad"))
                .sum();
    }

    private double calcularTotal(List<Map<String, Object>> carrito, String metodoEnvio) {
        double subtotal = calcularSubtotal(carrito);
        double envio = "express".equals(metodoEnvio) ? 20 : 
                      "gratis".equals(metodoEnvio) ? 0 : 10;
        return subtotal + envio;
    }

    private String generarNumeroPedido() {
        return "PED" + System.currentTimeMillis();
    }
}
