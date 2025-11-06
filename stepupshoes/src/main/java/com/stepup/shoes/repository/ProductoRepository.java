/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.stepup.shoes.repository;

import com.stepup.shoes.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    
    List<Producto> findByCategoriaNombre(String categoria);
    
    List<Producto> findByPrecioBetween(Double precioMin, Double precioMax);
    
    List<Producto> findByCategoriaNombreAndPrecioBetween(String categoria, Double precioMin, Double precioMax);
    
    List<Producto> findByDestacadoTrue();
    
    // ✅ CORREGIDO: Ahora existe la propiedad 'activo'
    List<Producto> findByActivoTrue();
    
    @Query("SELECT p FROM Producto p WHERE p.nombre LIKE %:termino% OR p.descripcion LIKE %:termino%")
    List<Producto> buscarPorTermino(@Param("termino") String termino);
    
    // Método adicional útil
    List<Producto> findByCategoriaNombreAndActivoTrue(String categoria);
}