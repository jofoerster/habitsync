package de.jofoerster.habitsync.service.notification;

import de.jofoerster.habitsync.model.notification.NotificationTemplate;
import de.jofoerster.habitsync.model.notification.NotificationType;
import de.jofoerster.habitsync.repository.notification.NotificationTemplateRepository;
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
            switch (notificationType) {
                case FIXED_TIME_PUSH_NOTIFICATION_HABIT -> {
                    template.setHtmlTemplateName(
                            "notification-templates/fixed-time-notification-template-habit");
                    template.setContentTemplateName("notification-templates-plain/fixed-time-notification-template-habit");
                }
                case THRESHOLD_PUSH_NOTIFICATION_HABIT -> {
                    template.setHtmlTemplateName(
                            "notification-templates/threshold-notification-template-habit");
                    template.setContentTemplateName(
                            "notification-templates-plain/threshold-notification-template-habit");
                }
                case OVERTAKE_PUSH_NOTIFICATION_HABIT -> {
                    template.setHtmlTemplateName(
                            "notification-templates/overtake-notification-template-habit");
                    template.setContentTemplateName(
                            "notification-templates-plain/overtake-notification-template-habit");
                }
                default -> {
                    template.setHtmlTemplateName(
                            "notification-templates/notification-template-single");
                    template.setHtmlShadeTemplateName(
                            "notification-templates/notification-template-shade");
                    template.setHtmlShadeMinimalTemplateName(
                            "notification-templates/notification-template-shade-minimal");
                }
            }
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
