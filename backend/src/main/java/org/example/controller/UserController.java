package org.example.controller;


import org.example.dtos.MessageDTO;
import org.example.dtos.PublicKeysDTO;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {


    @Autowired
    private UserService userService;
    @GetMapping("/getPublicKeys")
    private ResponseEntity<PublicKeysDTO> getKeys(@RequestParam String userEmail){
        PublicKeysDTO keys = userService.getPublicKeys(userEmail);
        return ResponseEntity.ok(keys);
    }
}
