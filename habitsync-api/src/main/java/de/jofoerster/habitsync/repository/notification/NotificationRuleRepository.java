package de.jofoerster.habitsync.repository.notification;

import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.model.notification.NotificationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRuleRepository extends JpaRepository<NotificationRule, Long> {

    List<NotificationRule> getNotificationRuleBySharedHabit(SharedHabit sharedHabit);
}
