package de.jofoerster.habitsync.repository.notification;

import de.jofoerster.habitsync.model.notification.NotificationRuleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRuleStatusRepository extends JpaRepository<NotificationRuleStatus, String> {
}
