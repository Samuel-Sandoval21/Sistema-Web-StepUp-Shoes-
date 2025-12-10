package com.stepup.shoes.service;  // ¡IMPORTANTE!

import com.stepup.shoes.model.Producto;
import com.stepup.shoes.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductoServiceImpl implements ProductoService {
    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public List<Producto> findAll() {
        return productoRepository.findAll();
    }

    @Override
    public Producto findById(Long id) {
        return productoRepository.findById(id).orElse(null);
    }

    @Override
    public Producto save(Producto producto) {
        return productoRepository.save(producto);
    }

    @Override
    public void deleteById(Long id) {
        productoRepository.deleteById(id);
    }

    @Override
    public List<Producto> findByCategoriaNombre(String categoria) {
        return productoRepository.findByCategoriaNombre(categoria);
    }

    @Override
    public List<Producto> findByPrecioBetween(Double precioMin, Double precioMax) {
        return productoRepository.findByPrecioBetween(precioMin, precioMax);
    }

    @Override
    public List<Producto> findByCategoriaAndPrecioBetween(String categoria, Double precioMin, Double precioMax) {
        return productoRepository.findByCategoriaNombreAndPrecioBetween(categoria, precioMin, precioMax);
    }

    @Override
    public List<Producto> buscarPorTermino(String termino) {
        return productoRepository.buscarPorTermino(termino);
    }

    @Override
    public List<Producto> obtenerDestacados() {
        return productoRepository.findByDestacadoTrue();
    }
}