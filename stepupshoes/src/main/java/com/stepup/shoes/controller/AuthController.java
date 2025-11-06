/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.controller;

import com.stepup.shoes.model.Usuario;
import com.stepup.shoes.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/login")
    public String mostrarLogin(Model model) {
        model.addAttribute("titulo", "Iniciar Sesión - StepUp Shoes");
        model.addAttribute("usuario", new Usuario());
        return "login";
    }

    @PostMapping("/login")
    public String procesarLogin(
            @RequestParam String email,
            @RequestParam String password,
            HttpSession session,
            Model model,
            RedirectAttributes redirectAttributes) {
        
        Optional<Usuario> usuarioOpt = usuarioService.findByEmail(email);
        
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            
            // Verificar contraseña (en producción usar BCrypt)
            if (usuario.getPassword().equals(password)) {
                if (!usuario.getActivo()) {
                    model.addAttribute("error", "Tu cuenta está desactivada");
                    return "login";
                }
                
                // Actualizar última sesión
                usuario.setUltimaSesion(LocalDateTime.now());
                usuarioService.save(usuario);
                
                // Guardar usuario en sesión
                session.setAttribute("usuario", usuario);
                session.setAttribute("usuarioId", usuario.getId());
                session.setAttribute("usuarioNombre", usuario.getNombre());
                session.setAttribute("usuarioRol", usuario.getRol());
                
                redirectAttributes.addFlashAttribute("mensaje", "¡Bienvenido " + usuario.getNombre() + "!");
                return "redirect:/";
            }
        }
        
        model.addAttribute("error", "Email o contraseña incorrectos");
        model.addAttribute("titulo", "Iniciar Sesión - StepUp Shoes");
        return "login";
    }

    @GetMapping("/registro")
    public String mostrarRegistro(Model model) {
        model.addAttribute("titulo", "Registro - StepUp Shoes");
        model.addAttribute("usuario", new Usuario());
        return "registro";
    }

    @PostMapping("/registro")
    public String procesarRegistro(
            @Valid @ModelAttribute Usuario usuario,
            BindingResult result,
            @RequestParam String confirmPassword,
            Model model,
            RedirectAttributes redirectAttributes) {
        
        // Verificar confirmación de contraseña
        if (!usuario.getPassword().equals(confirmPassword)) {
            result.rejectValue("password", "error.usuario", "Las contraseñas no coinciden");
        }
        
        // Verificar si el email ya existe
        if (usuarioService.existsByEmail(usuario.getEmail())) {
            result.rejectValue("email", "error.usuario", "El email ya está registrado");
        }
        
        if (result.hasErrors()) {
            model.addAttribute("titulo", "Registro - StepUp Shoes");
            return "registro";
        }
        
        // Guardar usuario
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setUltimaSesion(LocalDateTime.now());
        usuario.setActivo(true);
        usuario.setRol(Usuario.Rol.CLIENTE);
        
        Usuario usuarioGuardado = usuarioService.save(usuario);
        
        redirectAttributes.addFlashAttribute("mensaje", 
            "¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.");
        return "redirect:/auth/login";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("mensaje", "Sesión cerrada correctamente");
        return "redirect:/";
    }

    @GetMapping("/cuenta")
    public String miCuenta(Model model, HttpSession session) {
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
        model.addAttribute("titulo", "Mi Cuenta - StepUp Shoes");
        return "cuenta";
    }

    @PostMapping("/cuenta/actualizar")
    public String actualizarCuenta(
            @ModelAttribute Usuario usuario,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/auth/login";
        }
        
        Optional<Usuario> usuarioExistenteOpt = usuarioService.findById(usuarioId);
        if (usuarioExistenteOpt.isEmpty()) {
            session.invalidate();
            return "redirect:/auth/login";
        }
        
        Usuario usuarioExistente = usuarioExistenteOpt.get();
        usuarioExistente.setNombre(usuario.getNombre());
        // Actualizar otros campos según sea necesario
        
        usuarioService.save(usuarioExistente);
        
        // Actualizar sesión
        session.setAttribute("usuarioNombre", usuarioExistente.getNombre());
        
        redirectAttributes.addFlashAttribute("mensaje", "Perfil actualizado correctamente");
        return "redirect:/auth/cuenta";
    }

    @GetMapping("/recuperar-contrasena")
    public String mostrarRecuperarContrasena(Model model) {
        model.addAttribute("titulo", "Recuperar Contraseña - StepUp Shoes");
        return "recuperar-contrasena";
    }

    @PostMapping("/recuperar-contrasena")
    public String procesarRecuperarContrasena(
            @RequestParam String email,
            RedirectAttributes redirectAttributes) {
        
        // Lógica para enviar email de recuperación (simulado)
        if (usuarioService.existsByEmail(email)) {
            // En producción, aquí se enviaría un email con un enlace para restablecer
            redirectAttributes.addFlashAttribute("mensaje", 
                "Se ha enviado un enlace de recuperación a tu email");
        } else {
            redirectAttributes.addFlashAttribute("error", 
                "No existe una cuenta con ese email");
        }
        
        return "redirect:/auth/recuperar-contrasena";
    }
}
