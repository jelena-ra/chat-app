package org.example.controller;
import jakarta.validation.Valid;
import org.example.dtos.UserRegistrationDTO;
import org.example.model.VerificationCode;
import org.example.service.UserService;
import org.example.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private VerificationService verificationService;

    @PostMapping("/register")
    public String register(@Valid @RequestBody UserRegistrationDTO request) throws Exception {
        userService.GenerateNewUser(request);
        verificationService.sendCode(request.getEmail());

        return "User created. Verification code sent to email.";
    }

    @PostMapping("/verify")
    public String verify(@RequestParam String code,
                         @RequestParam String email) throws Exception {
        VerificationCode verificationCode = verificationService.findByEmail(email);

        if(verificationCode!=null && verificationCode.getCode().equals(code)) {
            userService.verify(email);
            verificationService.useVerification(email, code);
            return "Successfully verified";
        }
        else return "Failed verification.Wrong code.";
    }

}