package com.stepup.shoes.config;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;

@Configuration
@ConditionalOnProperty(prefix = "firebase", name = "enabled", havingValue = "true")
public class FirebaseConfig {

    @Value("${firebase.storage.bucket}")
    private String storageBucket;

    @Value("${firebase.json.file}")
    private String firebaseJsonFile;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            System.out.println("🔍 Buscando archivo Firebase: " + firebaseJsonFile);
            
            // Método 1: Usar ClassPathResource (recomendado)
            ClassPathResource resource = new ClassPathResource(firebaseJsonFile);
            
            if (!resource.exists()) {
                System.err.println("❌ No se encontró el archivo en classpath: " + firebaseJsonFile);
                System.err.println("❌ Ruta absoluta buscada: " + resource.getPath());
                
                // Listar archivos en resources para debug
                listResourceFiles();
                
                throw new RuntimeException("Archivo de Firebase no encontrado: " + firebaseJsonFile);
            }
            
            System.out.println("✅ Archivo encontrado en: " + resource.getURL());
            
            try (InputStream serviceAccount = resource.getInputStream()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .setStorageBucket(storageBucket)
                        .setDatabaseUrl("https://stepup-shoes.firebaseio.com")
                        .build();
                
                FirebaseApp.initializeApp(options);
                System.out.println("🔥 Firebase inicializado correctamente");
                System.out.println("📦 Bucket configurado: " + storageBucket);
            }
        }
        
        return FirebaseApp.getInstance();
    }

    private void listResourceFiles() {
        try {
            System.out.println("📁 Contenido de resources:");
            // Esto es para debug - ver qué archivos hay en resources
            ClassPathResource root = new ClassPathResource("/");
            if (root.exists()) {
                // Puedes añadir más lógica de debug aquí
                System.out.println("   - Root existe");
            }
        } catch (Exception e) {
            System.err.println("Error al listar resources: " + e.getMessage());
        }
    }

    @Bean
    public StorageClient firebaseStorage() throws IOException {
        return StorageClient.getInstance(firebaseApp());
    }

    @Bean
    public com.google.firebase.auth.FirebaseAuth firebaseAuth() throws IOException {
        return com.google.firebase.auth.FirebaseAuth.getInstance(firebaseApp());
    }
}