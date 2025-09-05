package de.jofoerster.habitsync.service.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.jofoerster.habitsync.dto.NotificationFrequencyDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.service.habit.HabitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationServiceNew {

    private final HabitService habitService;
    ObjectMapper mapper = new ObjectMapper();

    public NotificationServiceNew(HabitService habitService) {
        this.habitService = habitService;
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
}
