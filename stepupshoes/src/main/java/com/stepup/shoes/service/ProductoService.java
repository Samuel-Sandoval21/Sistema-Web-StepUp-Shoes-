/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.stepup.shoes.service;
 
import com.stepup.shoes.model.Producto;

import java.util.List;
 
public interface ProductoService {

    List<Producto> findAll();

    Producto findById(Long id);

    Producto save(Producto producto);

    void deleteById(Long id);

    List<Producto> findByCategoriaNombre(String categoria);

    List<Producto> findByPrecioBetween(Double precioMin, Double precioMax);

    List<Producto> findByCategoriaAndPrecioBetween(String categoria, Double precioMin, Double precioMax);

    List<Producto> buscarPorTermino(String termino);

    List<Producto> obtenerDestacados();

}
 
