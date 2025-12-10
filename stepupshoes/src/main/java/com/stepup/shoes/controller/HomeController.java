/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.controller;

import com.stepup.shoes.model.Producto;
import com.stepup.shoes.service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HomeController {

    @Autowired
    private ProductoService productoService;

    @GetMapping("/")
    public String home(Model model) {
        List<Producto> productosDestacados = productoService.obtenerDestacados();
        model.addAttribute("productosDestacados", productosDestacados);
        model.addAttribute("titulo", "StepUp Shoes - Encuentra tu Estilo Perfecto");
        return "index";
    }

    @GetMapping("/promociones")
    public String promociones(Model model) {
        model.addAttribute("titulo", "Promociones - StepUp Shoes");
        return "promociones";
    }

    @GetMapping("/contacto")
    public String contacto(Model model) {
        model.addAttribute("titulo", "Contacto - StepUp Shoes");
        return "contacto";
    }

  
    

    @GetMapping("/nosotros")
    public String nosotros(Model model) {
        model.addAttribute("titulo", "Nosotros - StepUp Shoes");
        return "nosotros";
    }

    // ✅ AGREGAR ESTOS MÉTODOS PARA LOGIN
    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("titulo", "Iniciar Sesión - StepUp Shoes");
        return "login";
    }

    @GetMapping("/registro")
    public String registro(Model model) {
        model.addAttribute("titulo", "Registro - StepUp Shoes");
        return "registro";
    }

    @GetMapping("/recuperar-contrasena")
    public String recuperarContrasena(Model model) {
        model.addAttribute("titulo", "Recuperar Contraseña - StepUp Shoes");
        return "recuperar-contrasena";
    }
}
