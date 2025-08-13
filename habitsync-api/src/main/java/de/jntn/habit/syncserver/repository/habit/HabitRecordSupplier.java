package de.jntn.habit.syncserver.repository.habit;

import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.habit.HabitRecord;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabit;
import de.jntn.habit.syncserver.service.notification.NotificationRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequiredArgsConstructor
public class HabitRecordSupplier {
    private final HabitRecordRepository habitRecordRepository;

    public List<HabitRecord> getHabitRecords(Habit habit, LocalDate since) {
        return habitRecordRepository.getHabitRecordsByParentUuidAndRecordDateGreaterThan(habit.getUuid(),
                since.toEpochDay() - 1);
    }

    public List<HabitRecord> getHabitRecordsInRange(Habit habit, LocalDate fromInclusive, LocalDate toInclusive) {
        return habitRecordRepository.getHabitRecordsByParentUuidAndRecordDateGreaterThanAndRecordDateLessThan(
                habit.getUuid(), fromInclusive.toEpochDay() - 1, toInclusive.toEpochDay() + 1);
    }

    public List<HabitRecord> getHabitRecords(Habit habit, int page, int limit) {
        return habitRecordRepository.findHabitRecordsByParentUuidOrderByRecordDateDesc(habit.getUuid(),
                PageRequest.of(page, limit));
    }

    public Long countRecordByHabit(Habit habit) {
        return habitRecordRepository.countByParentUuid(habit.getUuid());
    }

    public Long getTimeSinceLastRecordByHabit(Habit habit) {
        Optional<HabitRecord> recordOpt =
                habitRecordRepository.findFirstByParentUuidOrderByRecordDateDesc(habit.getUuid());
        return recordOpt.map(habitRecord -> LocalDate.now()
                        .toEpochDay() - habitRecord.getRecordDate())
                .orElse(Long.MAX_VALUE);
    }

    public Long countRecordsByHabitSince(Habit habit, LocalDate since, Double value) {
        return habitRecordRepository.countHabitRecordsByParentUuidAndRecordDateGreaterThanAndRecordValueGreaterThanEqual(
                habit.getUuid(), (int) since.toEpochDay() - 1, value);
    }

    public Long countRecordsByHabitSinceDays(Habit habit, Integer days) {
        return countRecordsByHabitSince(habit, LocalDate.now()
                .minusDays(days), habit.getDailyGoal());
    }

    public double getHabitRecordsByDate(Habit habit, int date) {
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordByRecordDateAndParentUuid(date, habit.getUuid());
        if (records.isEmpty()) {
            return 0;
        } else {
            return records.getFirst()
                    .getRecordValue();
        }
    }

    public double getHabitRecordsByDate(Habit habit, String date) { //used in thymeleaf
        LocalDate parsedDate = LocalDate.parse(date + "." + LocalDate.now()
                .getYear(), DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordByRecordDateAndParentUuid((int) parsedDate.toEpochDay(),
                        habit.getUuid());
        if (records.isEmpty()) {
            return 0;
        } else {
            return records.getFirst()
                    .getRecordValue();
        }
    }

    public Map<Integer, Boolean> getRecordIsCompletedByDateMap(LocalDate now, Habit habit) {
        Map<Integer, Boolean> result = new HashMap<>();
        int epochDay = (int) now.minusDays(2).toEpochDay();
        for (int i = 0; i <= 2; i++) {
            result.put(epochDay + i, habit.getCompletionForDay(this, epochDay + i));
        }
        return result;
    }

    public Map<Integer, Boolean> getRecordIsCompletedByDateMap(LocalDate now, SharedHabit sharedHabit, Habit habit,
                                                               NotificationRuleService notificationRuleService) {
        Map<Integer, Boolean> result = new HashMap<>();
        int epochDay = (int) now.minusDays(2).toEpochDay();
        for (int i = 0; i <= 2; i++) {
            result.put(epochDay + i,
                    sharedHabit.getCompletionForDay(habit, notificationRuleService, this, epochDay + i));
        }
        return result;
    }
}
