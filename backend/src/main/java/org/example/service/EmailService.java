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


    public void sendInvite(String fromEmail, String toEmail) throws MessagingException{
        String appLink = "http://192.168.1.130:8081/registration";

        String htmlContent = """
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f5f1f1; font-family:Arial, sans-serif;">

    <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <!-- HEADER -->
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#5a3e36; margin:0;">You're Invited 🎉</h2>
        </div>

        <!-- TEXT -->
        <p style="font-size:16px; color:#333; line-height:1.6;">
            Hello,
        </p>

        <p style="font-size:16px; color:#333; line-height:1.6;">
            <strong>""" + fromEmail + """
        </strong> has invited you to join our chat application.
        </p>

        <p style="font-size:16px; color:#333; line-height:1.6;">
            Create your account and start chatting instantly with your friends.
        </p>

        <!-- BUTTON -->
        <div style="text-align:center; margin:30px 0;">
            <a href=\"""" + appLink +
               """
               \"
               style="
                    background-color:#5a3e36;
                    color:#ffffff;
                    padding:14px 28px;
                    text-decoration:none;
                    border-radius:8px;
                    font-size:16px;
                    font-weight:bold;
                    display:inline-block;
               ">
                Join the App
            </a>
        </div>

        <!-- FALLBACK LINK -->
        <p style="font-size:14px; color:#777; text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>

        <p style="font-size:14px; color:#5a3e36; text-align:center; word-break:break-all;">
        """ + appLink + """
        </p>

        <hr style="border:none; border-top:1px solid #ddd; margin:30px 0;" />

        <!-- FOOTER -->
        <p style="font-size:12px; color:#999; text-align:center;">
            This invitation was sent by """ + fromEmail + """
        </p>

    </div>

</body>
</html>
""";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(toEmail);
        helper.setSubject("Invitation");
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }
}
