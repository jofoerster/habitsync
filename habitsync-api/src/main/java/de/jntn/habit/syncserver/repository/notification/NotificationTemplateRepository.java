package de.jntn.habit.syncserver.repository.notification;

import de.jntn.habit.syncserver.model.notification.NotificationTemplate;
import de.jntn.habit.syncserver.model.notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {
    List<NotificationTemplate> getNotificationTemplatesByNotificationType(NotificationType notificationType);
}
