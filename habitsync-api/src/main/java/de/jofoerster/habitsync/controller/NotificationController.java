package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.NotificationConfigDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

import static de.jofoerster.habitsync.controller.PermissionChecker.checkIfisAllowedToEdit;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final HabitService habitService;
    private final AccountService accountService;

    @PutMapping("/habit/{habitUuid}")
    public ResponseEntity<Void> scheduleNotificationForHabit(@PathVariable String habitUuid, @RequestBody
    NotificationConfigDTO frequencyDTO) {
        Optional<Habit> habit = habitService.getHabitByUuid(habitUuid);
        if (habit.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        checkIfisAllowedToEdit(habit.orElse(null), accountService.getCurrentAccount());
        boolean result = notificationService.createOrUpdateNotificationsForHabit(habit.get(), frequencyDTO);
        if (!result) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/habit/{habitUuid}")
    public ResponseEntity<Void> cancelNotificationForHabit(@PathVariable String habitUuid) {
        Optional<Habit> habit = habitService.getHabitByUuid(habitUuid);
        if (habit.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        checkIfisAllowedToEdit(habit.orElse(null), accountService.getCurrentAccount());
        boolean result = notificationService.deleteNotificationForHabit(habit.get());
        if (!result) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }
}
