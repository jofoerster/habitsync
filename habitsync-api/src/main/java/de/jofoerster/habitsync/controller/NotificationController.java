package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.NotificationConfigDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Notification management endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class NotificationController {

    private final NotificationService notificationService;
    private final HabitService habitService;
    private final AccountService accountService;
    private final PermissionChecker permissionChecker;

    @Operation(
            summary = "Schedule notification for habit",
            description = "Creates or updates notification settings for a specific habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully scheduled notification"),
            @ApiResponse(responseCode = "400", description = "Invalid notification configuration"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no edit access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PutMapping("/habit/{habitUuid}")
    public ResponseEntity<Void> scheduleNotificationForHabit(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @RequestBody NotificationConfigDTO frequencyDTO) {
        Optional<Habit> habit = habitService.getHabitByUuid(habitUuid);
        if (habit.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        permissionChecker.checkIfisAllowedToEdit(habit.orElse(null), accountService.getCurrentAccount());
        boolean result = notificationService.createOrUpdateNotificationsForHabit(habit.get(), frequencyDTO);
        if (!result) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Cancel notification for habit",
            description = "Removes all notification settings for a specific habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully cancelled notification"),
            @ApiResponse(responseCode = "400", description = "Failed to cancel notification"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no edit access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @DeleteMapping("/habit/{habitUuid}")
    public ResponseEntity<Void> cancelNotificationForHabit(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid) {
        Optional<Habit> habit = habitService.getHabitByUuid(habitUuid);
        if (habit.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        permissionChecker.checkIfisAllowedToEdit(habit.orElse(null), accountService.getCurrentAccount());
        boolean result = notificationService.deleteNotificationForHabit(habit.get());
        if (!result) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }
}
