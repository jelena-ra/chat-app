package org.example.repository;

import org.example.model.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationRepository extends JpaRepository<VerificationCode, Long > {
    Optional<VerificationCode> findByEmailAndExpirationTimeAfter(String email, LocalDateTime now);
    VerificationCode findByEmail(String email);
}
