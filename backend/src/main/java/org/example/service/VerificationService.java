package org.example.service;

import jakarta.validation.constraints.Email;
import org.example.model.VerificationCode;
import org.example.repository.VerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
}
