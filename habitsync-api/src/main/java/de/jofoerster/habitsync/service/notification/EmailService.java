package de.jofoerster.habitsync.service.notification;

import de.jofoerster.habitsync.model.notification.Notification;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.mail.enabled", havingValue = "true", matchIfMissing = true)
@ConditionalOnBean(JavaMailSender.class)
public class EmailService {

    private final JavaMailSender emailSender;

    @Value("${spring.mail.username}")
    private String mailSender;

    public void sendNotification(Notification notification) {
        if (notification.getReceiverAccount() == null || notification.getReceiverAccount().getEmail() == null) {
            log.debug("Cannot send email notification: receiver account or email is null");
            return;
        }

        MimeMessage mimeMessage = emailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailSender);
            helper.setTo(notification.getReceiverAccount().getEmail());
            helper.setSubject(notification.getSubject());
            helper.setText(notification.getHtmlContent(), true); // true = isHtml

            emailSender.send(mimeMessage);
            log.debug("Email notification sent to: {}", notification.getReceiverAccount().getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send email notification to: {}", 
                     notification.getReceiverAccount().getEmail(), e);
        }
    }
}
