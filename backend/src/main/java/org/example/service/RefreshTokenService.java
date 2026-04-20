package org.example.service;

import jakarta.transaction.Transactional;
import org.example.model.RefreshToken;
import org.example.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository _refreshTokenRepository;

    @Transactional
    public String  generateNewRefreshToken(Long userId) throws NoSuchAlgorithmException {
        if(_refreshTokenRepository.findByUserId(userId).isPresent()) _refreshTokenRepository.deleteByUserId(userId);

        RefreshToken refreshToken = new RefreshToken();
        String randomToken = UUID.randomUUID().toString();
        String hashedToken = hashToken(randomToken);
        refreshToken.setUserId(userId);
        refreshToken.setToken(hashedToken);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(365));

        _refreshTokenRepository.save(refreshToken);
        return randomToken;
    }


    public String hashToken(String token) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] encoded = digest.digest(token.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(encoded);
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    public RefreshToken validateRefreshToken(String refreshToken) throws NoSuchAlgorithmException{
        String hashed = hashToken(refreshToken);
        System.out.println("RAW: " + refreshToken);
        System.out.println("HASHED: " + hashed);
        RefreshToken rt = _refreshTokenRepository.findByToken(hashed).orElseThrow(()->new RuntimeException("Invalid Token"));
        if(!rt.getExpiryDate().isAfter(LocalDateTime.now())){
            throw new RuntimeException("Token expired");
        }
        return  rt;
    }




}
