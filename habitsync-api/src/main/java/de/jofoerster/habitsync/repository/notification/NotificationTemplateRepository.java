package de.jofoerster.habitsync.repository.notification;

import de.jofoerster.habitsync.model.notification.NotificationTemplate;
import de.jofoerster.habitsync.model.notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {
    List<NotificationTemplate> getNotificationTemplatesByNotificationType(NotificationType notificationType);
}
