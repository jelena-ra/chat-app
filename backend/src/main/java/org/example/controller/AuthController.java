package org.example.controller;
import org.example.model.User;
import org.example.service.UserService;
import org.example.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private VerificationService verificationService;

    @PostMapping("/register")
    public String register(@RequestParam String email,
                           @RequestParam String phone) throws Exception {

        User user = new User(email,phone);

        userService.GenerateNewUser(user);

        verificationService.sendCode(email);

        return "User created. Verification code sent to email.";
    }
    
}