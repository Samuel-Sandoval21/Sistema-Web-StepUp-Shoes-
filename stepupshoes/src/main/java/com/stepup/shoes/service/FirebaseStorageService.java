package com.stepup.shoes.service;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.firebase.cloud.StorageClient;

@Service
@ConditionalOnProperty(prefix = "firebase", name = "enabled", havingValue = "true")
public class FirebaseStorageService {
    
    @Autowired
    private StorageClient storageClient;
    
    @Value("${firebase.storage.bucket:stepup-shoes.appspot.com}")
    private String bucketName;
    
    // Estructura de carpetas
    public enum Folder {
        PRODUCTOS("productos/"),
        CATEGORIAS("categorias/"),
        USUARIOS("usuarios/"),
        HOME("home/"),
        PROMOCIONES("promociones/"),
        DEFAULT("default/");
        
        private final String path;
        
        Folder(String path) {
            this.path = path;
        }
        
        public String getPath() {
            return path;
        }
    }
    
    /**
     * Subir archivo a Firebase Storage
     */
    public String uploadFile(MultipartFile file, Folder folder, String fileName) throws IOException {
        // Validar archivo
        if (file.isEmpty()) {
            throw new IOException("El archivo está vacío");
        }
        
        // Generar nombre único si no se proporciona
        if (fileName == null || fileName.isEmpty()) {
            String originalName = file.getOriginalFilename();
            String extension = originalName.substring(originalName.lastIndexOf("."));
            fileName = UUID.randomUUID().toString() + extension;
        }
        
        // Ruta completa en Firebase
        String fullPath = folder.getPath() + fileName;
        
        // Obtener Storage
        Storage storage = storageClient.bucket().getStorage();
        
        // Crear metadata
        Map<String, String> metadata = new HashMap<>();
        metadata.put("originalName", file.getOriginalFilename());
        metadata.put("uploadedAt", new Date().toString());
        
        // Configurar BlobInfo
        BlobId blobId = BlobId.of(bucketName, fullPath);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .setMetadata(metadata)
                .build();
        
        // Subir archivo
        Blob blob = storage.create(blobInfo, file.getBytes());
        
        System.out.println("✅ Archivo subido: " + fullPath);
        
        // Generar URL pública con token de acceso
        return generateSignedUrl(blob, 7, TimeUnit.DAYS); // URL válida por 7 días
    }
    
    /**
     * Generar URL firmada (temporal)
     */
    private String generateSignedUrl(Blob blob, long duration, TimeUnit unit) throws UnsupportedEncodingException {
        try {
            // Configurar opciones para URL firmada
            Storage.SignUrlOption signUrlOption = Storage.SignUrlOption.withV4Signature();
            
            // Generar URL válida por el tiempo especificado
            return blob.signUrl(duration, unit, signUrlOption).toString();
            
        } catch (Exception e) {
            // Si falla la URL firmada, devolver URL pública simple
            return String.format(
                "https://storage.googleapis.com/%s/%s",
                bucketName,
                URLEncoder.encode(blob.getName(), StandardCharsets.UTF_8.toString())
            );
        }
    }
    
    /**
     * Generar URL pública (sin token)
     */
    public String generatePublicUrl(String filePath) {
        try {
            String encodedPath = URLEncoder.encode(filePath, StandardCharsets.UTF_8.toString())
                    .replace("+", "%20");
            
            return String.format(
                "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                bucketName,
                encodedPath
            );
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Subir imagen con compresión
     */
    public String uploadImage(MultipartFile imageFile, Folder folder, String fileName) throws IOException {
        // Validar que sea una imagen
        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("El archivo debe ser una imagen");
        }
        
        // Validar tamaño (máximo 5MB)
        if (imageFile.getSize() > 5 * 1024 * 1024) {
            throw new IOException("La imagen no debe superar los 5MB");
        }
        
        return uploadFile(imageFile, folder, fileName);
    }
    
    /**
     * Subir múltiples imágenes
     */
    public List<String> uploadMultipleImages(List<MultipartFile> files, Folder folder, String baseName) throws IOException {
        List<String> urls = new ArrayList<>();
        
        for (int i = 0; i < files.size(); i++) {
            String fileName = baseName + "-" + (i + 1) + getFileExtension(files.get(i));
            String url = uploadImage(files.get(i), folder, fileName);
            urls.add(url);
        }
        
        return urls;
    }
    
    /**
     * Eliminar archivo
     */
    public boolean deleteFile(String fileUrl) {
        try {
            String filePath = extractFilePathFromUrl(fileUrl);
            if (filePath == null) return false;
            
            Storage storage = storageClient.bucket().getStorage();
            return storage.delete(BlobId.of(bucketName, filePath));
        } catch (Exception e) {
            System.err.println("Error al eliminar archivo: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Extraer ruta del archivo de la URL
     */
    private String extractFilePathFromUrl(String fileUrl) {
        if (fileUrl == null) return null;
        
        try {
            // Para URLs de Firebase Storage
            if (fileUrl.contains("firebasestorage.googleapis.com")) {
                // Formato: https://.../o/productos%2Fimagen.jpg?alt=media
                String[] parts = fileUrl.split("/o/");
                if (parts.length < 2) return null;
                
                String encodedPath = parts[1].split("\\?")[0];
                return java.net.URLDecoder.decode(encodedPath, StandardCharsets.UTF_8.toString());
            }
            
            // Para URLs de Google Cloud Storage
            if (fileUrl.contains("storage.googleapis.com")) {
                // Formato: https://storage.googleapis.com/bucket/productos/imagen.jpg
                String[] parts = fileUrl.split(bucketName + "/");
                if (parts.length < 2) return null;
                return parts[1];
            }
            
            return null;
            
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Obtener extensión del archivo
     */
    private String getFileExtension(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            return ".jpg"; // Extensión por defecto
        }
        return originalName.substring(originalName.lastIndexOf("."));
    }
    
    /**
     * URL de imagen por defecto
     */
    public String getDefaultProductImage() {
        return generatePublicUrl(Folder.DEFAULT.getPath() + "producto-default.jpg");
    }
    
    /**
     * URL de avatar por defecto
     */
    public String getDefaultAvatar() {
        return generatePublicUrl(Folder.DEFAULT.getPath() + "avatar-default.png");
    }
}