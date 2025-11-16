/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.stepup.shoes.repository;

import com.stepup.shoes.model.Pedido;
import com.stepup.shoes.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    
    // Método para buscar pedidos por usuario
    List<Pedido> findByUsuario(Usuario usuario);
    
    // Método para buscar pedidos por usuario ordenados por fecha descendente
    List<Pedido> findByUsuarioOrderByFechaCreacionDesc(Usuario usuario);
    
    // Método adicional útil: buscar todos los pedidos ordenados por fecha descendente
    List<Pedido> findAllByOrderByFechaCreacionDesc();
    
    // Método para buscar pedidos por estado
    List<Pedido> findByEstado(Pedido.EstadoPedido estado);
    
    // Método para buscar pedidos por número de pedido
    Optional<Pedido> findByNumeroPedido(String numeroPedido);
}