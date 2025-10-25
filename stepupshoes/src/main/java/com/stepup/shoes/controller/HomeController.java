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
}
