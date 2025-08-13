package de.jntn.habit.syncserver.repository.notification;

import de.jntn.habit.syncserver.model.notification.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateRepository extends JpaRepository<NotificationTemplate, Long> {
}
