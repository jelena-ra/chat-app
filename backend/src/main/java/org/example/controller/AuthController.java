package org.example.controller;
import jakarta.validation.Valid;
import org.example.dtos.TokensDTO;
import org.example.dtos.UserRegistrationDTO;
import org.example.model.RefreshToken;
import org.example.model.User;
import org.example.model.VerificationCode;
import org.example.security.JwtUtil;
import org.example.service.RefreshTokenService;
import org.example.service.UserService;
import org.example.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtil  jwtUtil;
    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private VerificationService verificationService;

    @PostMapping("/register")
    public String register(@Valid @RequestBody UserRegistrationDTO request) throws Exception {
        userService.GenerateNewUser(request);
        verificationService.sendCode(request.getEmail());

        return "User created. Verification code sent to email.";
    }

    @PostMapping("/verify")
    public ResponseEntity<TokensDTO> verify(@RequestParam String code,
                                            @RequestParam String email) throws Exception {
        VerificationCode verificationCode = verificationService.findByEmail(email);

        if(verificationCode!=null && verificationCode.getCode().equals(code)) {
            userService.verify(email);
            User user = userService.getByEmail(email);
            verificationService.useVerification(email, code);
            String accesstoken = jwtUtil.generateToken(user.getId());
            String refreshToken = refreshTokenService.generateNewRefreshToken(user.getId());

            return ResponseEntity.ok(new TokensDTO(accesstoken, refreshToken));
        }
        else {
            throw new RuntimeException("Invalid verification code");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) throws Exception {

        String refreshToken = request.get("refreshToken");

        RefreshToken rt = refreshTokenService.validateRefreshToken(refreshToken);

        Long userId = rt.getUserId();

        // 🔥 novi access token
        String newAccessToken = jwtUtil.generateToken(userId);

        // 🔥 opciono: rotacija refresh tokena (preporučeno)
        String newRefreshToken = refreshTokenService.generateNewRefreshToken(userId);

        return ResponseEntity.ok(
                new TokensDTO(newAccessToken, newRefreshToken)
        );
    }

}