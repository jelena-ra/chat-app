package org.example.controller;


import org.example.dtos.MessageDTO;
import org.example.dtos.PublicKeysDTO;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @PostMapping("/getAllPublicKeys")
    private  ResponseEntity<List<PublicKeysDTO>> getAllKeys(@RequestBody List<String> userEmails){
        List<PublicKeysDTO> keys = userService.getAllPublicKeys(userEmails);
        return ResponseEntity.ok(keys);
    }


}
