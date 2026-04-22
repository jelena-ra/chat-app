package org.example.controller;


import org.example.dtos.MessageDTO;
import org.example.dtos.PublicKeysDTO;
import org.example.dtos.UserProfileDTO;
import org.example.model.Image;
import org.example.model.User;
import org.example.model.UserProfile;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {


    @Autowired
    private UserService userService;
    @GetMapping("/getPublicKeys")
    public ResponseEntity<PublicKeysDTO> getKeys(@RequestParam String userEmail){
        PublicKeysDTO keys = userService.getPublicKeys(userEmail);
        return ResponseEntity.ok(keys);
    }

    @PostMapping("/getAllPublicKeys")
    public  ResponseEntity<List<PublicKeysDTO>> getAllKeys(@RequestBody List<String> userEmails){
        List<PublicKeysDTO> keys = userService.getAllPublicKeys(userEmails);
        return ResponseEntity.ok(keys);
    }

    @PostMapping("/profile/image")
    public ResponseEntity<String> uploadProfileImage(
            @RequestParam("email") String email,
            @RequestParam("file") MultipartFile file
    ) {
        userService.uploadProfileImage(email, file);
        return ResponseEntity.ok("Profile image uploaded successfully");
    }

    @PostMapping("/profile/edit")
    public ResponseEntity<String> editProfile(
            @RequestBody UserProfileDTO profile
    ) {
        userService.editProfile(profile.getEmail(), profile.getName(), profile.getSurname(), profile.getBirthdate());
        return ResponseEntity.ok("Profile edited successfully");
    }

    @GetMapping("/profile/image")
    public ResponseEntity<byte[]> getProfileImage(@RequestParam String email) {
        User user = userService.getByEmail(email);

        if (user.getProfile() == null ) {
            return ResponseEntity.notFound().build();
        }

        Image image = user.getProfile().getImage();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .body(image.getData());
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@RequestParam String email) {
        User user = userService.getByEmail(email);

        if (user.getProfile() == null || user.getProfile().getImage() == null) {
            return ResponseEntity.notFound().build();
        }

        UserProfileDTO profile = new UserProfileDTO(email,user.getProfile());

        return ResponseEntity.ok(profile);
    }
}


