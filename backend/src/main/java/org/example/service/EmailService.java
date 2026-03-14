package org.example.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;


@Service
public class EmailService {

    public String generateCode(){
        SecureRandom rand = new SecureRandom();
        return String.valueOf(100000 + rand.nextInt(900000));
    }

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String verificationCode) throws MessagingException {
        String reportLink = "http://localhost:8080/report?email=" + toEmail;

        String htmlContent = """
            <html>
            <body style="font-family:Arial;">
                <h2>Email verification</h2>
            
                <p>Your verification code is:</p>
            
                <div style="background:#f3f3f3;padding:20px;text-align:center;font-size:30px;letter-spacing:5px;">""" + verificationCode +
                """
                </div>
                
                <p>Enter this code in the app to verify your account.</p>

                <p style="margin-top:30px;">
                    If you didn’t request this verification code,
                    <a href=\"""" + reportLink +
                """
                ">report it here</a>.
                </p>

                <p style="color:gray;font-size:12px;">
                    This code expires in 5 minutes.
                </p>
            </body>
            </html>
            """;

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(toEmail);
        helper.setSubject("Verification code");
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }
}
