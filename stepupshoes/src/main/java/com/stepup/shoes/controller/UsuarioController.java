/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.controller;

import com.stepup.shoes.model.Pedido;
import com.stepup.shoes.model.Usuario;
import com.stepup.shoes.service.PedidoService;
import com.stepup.shoes.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/usuario")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private PedidoService pedidoService;

    @GetMapping("/perfil")
    public String verPerfil(Model model, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        Usuario usuario = usuarioOpt.get();
        List<Pedido> pedidos = pedidoService.findByUsuario(usuario);

        // Calcular estadísticas
        long totalPedidos = pedidos.size();
        long totalFavoritos = 0; // En una implementación real, esto vendría de un servicio
        double totalGastado = pedidos.stream().mapToDouble(Pedido::getTotal).sum();
        int puntos = (int) (totalGastado / 10); // 1 punto por cada $10 gastados

        model.addAttribute("usuario", usuario);
        model.addAttribute("pedidos", pedidos);
        model.addAttribute("totalPedidos", totalPedidos);
        model.addAttribute("totalFavoritos", totalFavoritos);
        model.addAttribute("totalGastado", totalGastado);
        model.addAttribute("puntos", puntos);
        model.addAttribute("titulo", "Mi Perfil - StepUp Shoes");

        return "cuenta";
    }

    @PostMapping("/perfil/actualizar")
    public String actualizarPerfil(
            @ModelAttribute Usuario usuarioActualizado,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        Usuario usuario = usuarioOpt.get();
        
        // Actualizar campos permitidos
        usuario.setNombre(usuarioActualizado.getNombre());
        // Actualizar otros campos según sea necesario
        
        usuarioService.save(usuario);
        
        // Actualizar sesión
        session.setAttribute("usuarioNombre", usuario.getNombre());
        
        redirectAttributes.addFlashAttribute("mensaje", "Perfil actualizado correctamente");
        return "redirect:/usuario/perfil";
    }

    @GetMapping("/pedidos")
    public String verPedidosUsuario(Model model, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        List<Pedido> pedidos = pedidoService.findByUsuarioOrderByFechaCreacionDesc(usuarioOpt.get());
        model.addAttribute("pedidos", pedidos);
        model.addAttribute("titulo", "Mis Pedidos - StepUp Shoes");

        return "mis-pedidos";
    }

    @GetMapping("/pedidos/{pedidoId}")
    public String verDetallePedidoUsuario(
            @PathVariable Long pedidoId,
            Model model,
            HttpSession session) {
        
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Pedido> pedidoOpt = pedidoService.findById(pedidoId);
        if (pedidoOpt.isEmpty()) {
            return "redirect:/usuario/pedidos";
        }

        Pedido pedido = pedidoOpt.get();
        
        // Verificar que el pedido pertenece al usuario
        if (!pedido.getUsuario().getId().equals(usuarioId)) {
            return "redirect:/usuario/pedidos";
        }

        model.addAttribute("pedido", pedido);
        model.addAttribute("titulo", "Pedido #" + pedido.getNumeroPedido() + " - StepUp Shoes");

        return "detalle-pedido";
    }

    @PostMapping("/pedidos/{pedidoId}/cancelar")
    public String cancelarPedido(
            @PathVariable Long pedidoId,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Pedido> pedidoOpt = pedidoService.findById(pedidoId);
        if (pedidoOpt.isEmpty()) {
            return "redirect:/usuario/pedidos";
        }

        Pedido pedido = pedidoOpt.get();
        
        // Verificar que el pedido pertenece al usuario y está pendiente
        if (!pedido.getUsuario().getId().equals(usuarioId) || 
            pedido.getEstado() != Pedido.EstadoPedido.PENDIENTE) {
            return "redirect:/usuario/pedidos";
        }

        // Cancelar pedido
        pedido.setEstado(Pedido.EstadoPedido.CANCELADO);
        pedidoService.save(pedido);

        redirectAttributes.addFlashAttribute("mensaje", "Pedido cancelado correctamente");
        return "redirect:/usuario/pedidos";
    }

    @GetMapping("/favoritos")
    public String verFavoritos(Model model, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        // En una implementación real, aquí se obtendrían los productos favoritos del usuario
        // Por ahora devolvemos una lista vacía
        model.addAttribute("favoritos", new ArrayList<>());
        model.addAttribute("titulo", "Mis Favoritos - StepUp Shoes");

        return "favoritos";
    }

    @GetMapping("/configuracion")
    public String configuracionCuenta(Model model, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }

        Optional<Usuario> usuarioOpt = usuarioService.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }

        model.addAttribute("usuario", usuarioOpt.get());
        model.addAttribute("titulo", "Configuración - StepUp Shoes");

        return "configuracion-cuenta";
    }
}
