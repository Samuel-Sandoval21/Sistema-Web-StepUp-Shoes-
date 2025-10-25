/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.stepup.shoes.model;
 
import jakarta.persistence.*;

import lombok.Data;
 
@Data

@Entity

@Table(name = "detalles_pedido")

public class DetallePedido {

    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "pedido_id")

    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "producto_id")

    private Producto producto;

    private Integer cantidad;

    private Double precio;

    private Integer talla;

}
 
