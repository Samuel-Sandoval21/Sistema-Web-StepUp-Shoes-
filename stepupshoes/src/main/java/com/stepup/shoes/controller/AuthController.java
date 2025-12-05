package com.stepup.shoes.controller;

import com.stepup.shoes.model.Usuario;
import com.stepup.shoes.service.UsuarioService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ---------------- LOGIN FORM -------------------
    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("usuario", new Usuario());
        return "login";
    }

    // ---------------- REGISTRO -------------------
    @GetMapping("/registro")
    public String registro(Model model) {
        model.addAttribute("usuario", new Usuario());
        return "registro";
    }

    @PostMapping("/registro")
    public String registrar(
            @Valid @ModelAttribute Usuario usuario,
            BindingResult result,
            @RequestParam String confirmPassword,
            RedirectAttributes redirectAttributes,
            Model model) {

        if (!usuario.getPassword().equals(confirmPassword)) {
            result.rejectValue("password", "error.usuario", "Las contraseñas no coinciden");
        }

        if (usuarioService.existsByEmail(usuario.getEmail())) {
            result.rejectValue("email", "error.usuario", "El correo ya está registrado");
        }

        if (result.hasErrors()) {
            return "registro";
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setUltimaSesion(LocalDateTime.now());
        usuario.setActivo(true);
        usuario.setRol(Usuario.Rol.CLIENTE);

        usuarioService.save(usuario);

        redirectAttributes.addFlashAttribute("mensaje",
                "¡Registro exitoso! Ahora puedes iniciar sesión.");

        return "redirect:/auth/login";
    }

    // ---------------- LOGOUT -------------------
    @GetMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("mensaje", "Sesión cerrada");
        return "redirect:/auth/login";
    }
}
