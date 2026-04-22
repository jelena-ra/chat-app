package org.example.service;

import org.example.model.Image;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ImageService {

    public Image createImageFromFile(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }

            Image image = new Image();
            image.setData(file.getBytes());
            image.setContentType(contentType);
            image.setFileName(file.getOriginalFilename());

            return image;

        } catch (IOException e) {
            throw new RuntimeException("Failed to read image file");
        }
    }
}