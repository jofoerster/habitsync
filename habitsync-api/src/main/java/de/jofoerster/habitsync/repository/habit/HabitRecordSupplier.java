package de.jofoerster.habitsync.repository.habit;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitRecord;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
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
}
