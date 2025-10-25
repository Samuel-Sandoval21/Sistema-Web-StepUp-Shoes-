/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.model;
 
import jakarta.persistence.*;

import lombok.Data;

import java.util.List;
 
@Data

@Entity

@Table(name = "productos")

public class Producto {

    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @Column(nullable = false)

    private String nombre;

    @Column(length = 1000)

    private String descripcion;

    @Column(nullable = false)

    private Double precio;

    private Integer stock;

    @Column(name = "imagen_url")

    private String imagenUrl;

    private Boolean destacado = false;

    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "categoria_id")

    private Categoria categoria;

    @ElementCollection

    @CollectionTable(name = "producto_tallas", joinColumns = @JoinColumn(name = "producto_id"))

    @Column(name = "talla")

    private List<Integer> tallasDisponibles;

}
 