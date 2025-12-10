package com.stepup.shoes.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.stepup.shoes.service.FirebaseStorageService;

@RestController
@RequestMapping("/api/firebase")
@ConditionalOnProperty(prefix = "firebase", name = "enabled", havingValue = "true")
public class FirebaseController {
    
    @Autowired
    private FirebaseStorageService firebaseStorageService;
    
    /**
     * Subir imagen de producto
     */
    @PostMapping("/upload/product-image")
    public ResponseEntity<?> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "productoId", required = false) Long productoId) {
        
        try {
            String fileName = productoId != null ? 
                "producto-" + productoId + "-" + System.currentTimeMillis() : 
                "producto-" + System.currentTimeMillis();
            
            String imageUrl = firebaseStorageService.uploadImage(
                file, 
                FirebaseStorageService.Folder.PRODUCTOS,
                fileName
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("imageUrl", imageUrl);
            response.put("fileName", fileName);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    /**
     * Subir múltiples imágenes
     */
    @PostMapping("/upload/multiple")
    public ResponseEntity<?> uploadMultipleImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("folder") String folder) {
        
        try {
            FirebaseStorageService.Folder targetFolder = 
                FirebaseStorageService.Folder.valueOf(folder.toUpperCase());
            
            String baseName = "upload-" + System.currentTimeMillis();
            var filesList = Arrays.asList(files);
            
            var urls = firebaseStorageService.uploadMultipleImages(
                filesList, targetFolder, baseName
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "urls", urls,
                "count", urls.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    /**
     * Eliminar imagen
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteImage(@RequestParam String imageUrl) {
        boolean deleted = firebaseStorageService.deleteFile(imageUrl);
        
        if (deleted) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Imagen eliminada"
            ));
        } else {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "No se pudo eliminar la imagen"));
        }
    }
    
    /**
     * Obtener URL de imagen por defecto
     */
    @GetMapping("/default-image")
    public ResponseEntity<?> getDefaultImage() {
        String defaultImage = firebaseStorageService.getDefaultProductImage();
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "imageUrl", defaultImage
        ));
    }
    
    /**
     * Previsualizar URL para imagen (sin subir)
     */
    @PostMapping("/preview-url")
    public ResponseEntity<?> getPreviewUrl(@RequestParam String fileName) {
        String previewUrl = firebaseStorageService.generatePublicUrl(
            FirebaseStorageService.Folder.PRODUCTOS.getPath() + fileName
        );
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "previewUrl", previewUrl
        ));
    }
}