package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitStatus;
import de.jofoerster.habitsync.model.habit.HabitType;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.CachingHabitProgressService;
import de.jofoerster.habitsync.service.habit.HabitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/metrics")
@Tag(name = "Metrics", description = "Metrics endpoints for Prometheus - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class HabitMetricsController {

    private final HabitService habitService;
    private final AccountService accountService;
    private final CachingHabitProgressService cachingHabitProgressService;

    @Operation(
            summary = "Get habit metrics in Prometheus format",
            description = "Returns the progress of all active habits for the authenticated user in Prometheus text format."
    )
    @GetMapping(value = "/habits", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getHabitMetrics() {
        Account account = accountService.getCurrentAccount();
        List<Habit> habits = habitService.getAllUserHabitsByType(account, HabitType.INTERNAL, HabitStatus.ACTIVE);

        StringBuilder sb = new StringBuilder();
        sb.append("# HELP habitsync_habit_progress The completion percentage of the habit (0-100)\n");
        sb.append("# TYPE habitsync_habit_progress gauge\n");

        for (Habit habit : habits) {
            if (habit.isChallengeHabit()) {
                continue;
            }
            double progress = cachingHabitProgressService.getCompletionPercentage(habit);
            String name = escapePrometheusString(habit.getName());
            String tag = escapePrometheusString(habit.getGroupName() != null ? habit.getGroupName() : "");
            
            sb.append(String.format(Locale.US,
                    "habitsync_habit_progress{name=\"%s\", tag=\"%s\"} %f\n",
                    name, tag, progress
            ));
        }

        return ResponseEntity.ok(sb.toString());
    }

    private String escapePrometheusString(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                    .replace("\n", "\\n")
                    .replace("\"", "\\\"");
    }
}
