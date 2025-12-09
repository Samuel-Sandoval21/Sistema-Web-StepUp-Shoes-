/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/contacto")
public class ContactoController {

    @PostMapping("/enviar")
    public String enviarMensaje(@RequestParam String nombre,
                                @RequestParam String email,
                                @RequestParam String mensaje,
                                Model model) {

        model.addAttribute("exito", true);
        model.addAttribute("nombre", nombre);

        return "contacto";
    }
}
