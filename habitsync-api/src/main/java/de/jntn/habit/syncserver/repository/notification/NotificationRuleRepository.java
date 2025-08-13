package de.jntn.habit.syncserver.repository.notification;

import de.jntn.habit.syncserver.model.sharedHabit.SharedHabit;
import de.jntn.habit.syncserver.model.notification.NotificationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRuleRepository extends JpaRepository<NotificationRule, Long> {

    List<NotificationRule> getNotificationRuleBySharedHabit(SharedHabit sharedHabit);
}
