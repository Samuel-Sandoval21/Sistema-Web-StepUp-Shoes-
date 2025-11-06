/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.service;
import com.stepup.shoes.model.Pedido;
import com.stepup.shoes.model.Usuario;
import com.stepup.shoes.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PedidoServiceImpl implements PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Override
    public List<Pedido> findAll() {
        return pedidoRepository.findAll();
    }

    @Override
    public Optional<Pedido> findById(Long id) {
        return pedidoRepository.findById(id);
    }

    @Override
    public Pedido save(Pedido pedido) {
        return pedidoRepository.save(pedido);
    }

    @Override
    public void deleteById(Long id) {
        pedidoRepository.deleteById(id);
    }

    @Override
    public List<Pedido> findByUsuario(Usuario usuario) {
        return pedidoRepository.findByUsuario(usuario);
    }

    @Override
    public List<Pedido> findByUsuarioOrderByFechaCreacionDesc(Usuario usuario) {
        return pedidoRepository.findByUsuarioOrderByFechaCreacionDesc(usuario);
    }
}