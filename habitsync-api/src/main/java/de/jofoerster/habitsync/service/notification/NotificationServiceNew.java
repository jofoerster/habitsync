package de.jofoerster.habitsync.service.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.jofoerster.habitsync.dto.NotificationFrequencyDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.repository.notification.NotificationRepository;
import de.jofoerster.habitsync.service.habit.HabitService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationServiceNew {

    private final HabitService habitService;
    private final NotificationRepository notificationRepository;
    private final SchedulingService schedulingService;

    ObjectMapper mapper = new ObjectMapper();

    public NotificationServiceNew(HabitService habitService, NotificationRepository notificationRepository,
                                  SchedulingService schedulingService) {
        this.habitService = habitService;
        this.notificationRepository = notificationRepository;
        this.schedulingService = schedulingService;
    }

    @PostConstruct
    public void init() {
        log.info("Scheduling user notification jobs");
        habitService.getHabitsWithReminders().forEach(h -> {
            schedulingService.scheduleNotificationJob(h.getUuid(), habitService.getNotificationFrequency(h));
        });
    }

    public boolean createOrUpdateNotificationForHabit(Habit habit, NotificationFrequencyDTO frequency) {
        try {
            habit.setReminderCustom(mapper.writeValueAsString(frequency));
            habitService.saveHabit(habit);
            return true;
        } catch (JsonProcessingException e) {
            log.warn("Could not set reminderCustom for habit {}", habit.getUuid(), e);
            return false;
        }
    }

    public boolean deleteNotificationForHabit(Habit habit) {
        habit.setReminderCustom(null);
        habitService.saveHabit(habit);
        return true;
    }

    public void sendPushNotificationsForUser(Account account) {
        notificationRepository.findAllByReceiverAccount(account);

    }
}
