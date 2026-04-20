package org.example.service;

import jakarta.transaction.Transactional;
import jakarta.validation.constraints.Email;
import org.example.model.VerificationCode;
import org.example.repository.VerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
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

    public void useVerification(String email,String code){
        VerificationCode verification = _verificationRepository.findByEmail(email);
         _verificationRepository.delete(verification);
    }

    public void resendCode(String email) throws Exception {
        VerificationCode oldcode = _verificationRepository.findByEmail(email);
        if (oldcode!=null)_verificationRepository.delete(oldcode);
        sendCode(email);
    }

    @Transactional
    @Scheduled(fixedRate = 6 * 60 * 1000)
    public void deleteExpiredCodes(){
         var expiredCodes = _verificationRepository.findAllByExpirationTimeBefore(LocalDateTime.now());
         if(!expiredCodes.isEmpty()) _verificationRepository.deleteAll(expiredCodes);
    }
}
