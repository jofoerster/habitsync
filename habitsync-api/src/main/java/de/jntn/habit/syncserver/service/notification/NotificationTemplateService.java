package de.jntn.habit.syncserver.service.notification;

import de.jntn.habit.syncserver.model.notification.NotificationTemplate;
import de.jntn.habit.syncserver.model.notification.NotificationType;
import de.jntn.habit.syncserver.repository.notification.NotificationTemplateRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationTemplateService {
    private final NotificationTemplateRepository notificationTemplateRepository;

    public NotificationTemplateService(NotificationTemplateRepository notificationTemplateRepository) {
        this.notificationTemplateRepository = notificationTemplateRepository;
    }

    @PostConstruct
    public void init() {
        // Create Templates for each type of notification on startup

        for (NotificationType notificationType : NotificationType.values()) {
            List<NotificationTemplate> templates =
                    notificationTemplateRepository.getNotificationTemplatesByNotificationType(notificationType);
            NotificationTemplate template = new NotificationTemplate();
            if (!templates.isEmpty()) {
                template = templates.getFirst();
            }
            template.setNotificationType(notificationType);
            template.setHtmlTemplateName(
                    "notification-templates/notification-template-single"); //move into switch as soon as there are
            // different ones
            template.setHtmlShadeTemplateName(
                    "notification-templates/notification-template-shade"); //move into switch as soon as there are
            // different ones
            template.setHtmlShadeMinimalTemplateName(
                    "notification-templates/notification-template-shade-minimal"); //move into switch as soon as
            // there are different ones
            template.setSubjectTemplate(notificationType.template);
            notificationTemplateRepository.save(template);

        }
    }

    public void saveNotificationTemplate(NotificationTemplate notificationTemplate) {
        notificationTemplateRepository.save(notificationTemplate);
    }

    public NotificationTemplate getNotificationTemplateByNotificationType(NotificationType notificationType) {
        return notificationTemplateRepository.getNotificationTemplatesByNotificationType(notificationType)
                .getFirst();
    }
}
