package org.example.service;

import jakarta.validation.constraints.Email;
import org.example.model.VerificationCode;
import org.example.repository.VerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class VerificationService {

    @Autowired
    private   EmailService emailService;

    @Autowired
    private   VerificationRepository _verificationRepository;
    public void sendCode(String email) throws Exception {

        String code = emailService.generateCode();

        VerificationCode verification = new VerificationCode(
                email,
                code,
                LocalDateTime.now().plusMinutes(5),
                false
        );

        _verificationRepository.save(verification);

        emailService.sendVerificationEmail(email, code);
    }

    public VerificationCode findByEmail(String email){
        return _verificationRepository.findByEmailAndExpirationTimeAfter(email, LocalDateTime.now()).orElse(null);
    }

    public VerificationCode useVerification(String email,String code){
        VerificationCode verification = _verificationRepository.findByEmail(email);
        verification.setUsed(true);
        return _verificationRepository.save(verification);
    }
}
