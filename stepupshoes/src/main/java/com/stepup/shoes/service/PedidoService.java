/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.service;

import com.stepup.shoes.model.Pedido;
import com.stepup.shoes.model.Usuario;
import java.util.List;
import java.util.Optional;

public interface PedidoService {
    List<Pedido> findAll();
    Optional<Pedido> findById(Long id);
    Pedido save(Pedido pedido);
    void deleteById(Long id);
    List<Pedido> findByUsuario(Usuario usuario);
    List<Pedido> findByUsuarioOrderByFechaCreacionDesc(Usuario usuario);
}