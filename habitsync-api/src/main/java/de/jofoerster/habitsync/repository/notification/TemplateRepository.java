package de.jofoerster.habitsync.repository.notification;

import de.jofoerster.habitsync.model.notification.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateRepository extends JpaRepository<NotificationTemplate, Long> {
}
