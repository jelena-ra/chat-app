package org.example.controller;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.dtos.PublicKeysDTO;
import org.example.dtos.TokensDTO;
import org.example.dtos.UserRegistrationDTO;
import org.example.model.RefreshToken;
import org.example.model.User;
import org.example.model.VerificationCode;
import org.example.config.JwtUtil;
import org.example.service.RefreshTokenService;
import org.example.service.UserService;
import org.example.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
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
    public  ResponseEntity<Map<String, String>> register(@Valid @RequestBody UserRegistrationDTO request) throws Exception {
        userService.GenerateNewUser(request);
        verificationService.sendCode(request.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("message", "User created. Verification code sent to email.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public  ResponseEntity<TokensDTO> login(@Valid @RequestBody UserRegistrationDTO request) throws Exception {
        User user = userService.getByEmail(request.getEmail());
        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email first");
        }
        String accessToken = jwtUtil.generateToken(user.getId());
        String refreshToken = refreshTokenService.generateNewRefreshToken(user.getId());

        return ResponseEntity.ok(new TokensDTO(refreshToken, accessToken));
    }
    @PostMapping("/publicKeys")
    public ResponseEntity<String> savePublicKeys(@RequestBody PublicKeysDTO keysDTO) {
        System.out.println("trazio kljuc");
        userService.savePublicKey(keysDTO.getEmail(), keysDTO.getPublicSigningkey(), keysDTO.getPublicEncryptingkey());
        return ResponseEntity.ok("Sucesfully saved");
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

            return ResponseEntity.ok(new TokensDTO(refreshToken, accesstoken));
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

        String newAccessToken = jwtUtil.generateToken(userId);

        String newRefreshToken = refreshTokenService.generateNewRefreshToken(userId);

        return ResponseEntity.ok(
                new TokensDTO( newRefreshToken,newAccessToken)
        );
    }

    @PostMapping("/resendCode")
    public ResponseEntity<String> resendCode(@RequestParam String email) throws Exception {
        verificationService.resendCode(email);
        return ResponseEntity.ok("Code successfully resent");
    }

}