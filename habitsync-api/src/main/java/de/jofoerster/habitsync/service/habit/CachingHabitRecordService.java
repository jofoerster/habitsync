package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.dto.HabitRecordReadDTO;
import de.jofoerster.habitsync.dto.HabitRecordWriteDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitRecord;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CachingHabitRecordService {

    private final HabitRecordRepository habitRecordRepository;
    private final CacheManager cacheManager;
    private final HabitRecordService habitRecordService;

    public String getCacheKey(String habitUuid, int epochDay) {
        return habitUuid + "_" + epochDay;
    }

    public void evictCache(Habit habit, int epochDay) {
        LocalDate date = LocalDate.ofEpochDay(epochDay);
        LocalDate startDate;
        LocalDate endDate;
        switch (habit.getParsedFrequencyType()) {
            case MONTHLY -> {
                startDate = date.with(TemporalAdjusters.firstDayOfMonth());
                endDate = date.with(TemporalAdjusters.lastDayOfMonth());
            }
            case X_TIMES_PER_Y_DAYS -> {
                startDate = date.minusDays(habit.parseCustomFrequency()[1] - 1);
                endDate = date;
            }
            default-> { // always WEEKLY
                startDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                endDate = startDate.plusDays(6);
            }
        }
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            int dayEpoch = (int) d.toEpochDay();
            Objects.requireNonNull(cacheManager.getCache("habitRecordCache"))
                    .evictIfPresent(getCacheKey(habit.getUuid(), dayEpoch));
        }
    }

    @Cacheable(value = "habitRecordCache", key = "#root.target.getCacheKey(#habit.getUuid(), #epochDay)")
    public HabitRecordReadDTO getHabitRecordByHabitAndEpochDay(Habit habit, Integer epochDay) {
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordByParentUuidAndRecordDate(habit.getUuid(), epochDay);
        if (records != null && !records.isEmpty()) {
            HabitRecord record = records.getFirst();
            return habitRecordService.getApiRecordFromRecord(habit, record);
        }
        return HabitRecordReadDTO.builder()
                .habitUuid(habit.getUuid())
                .epochDay(epochDay)
                .recordValue(0d)
                .build();
    }

    public HabitRecordReadDTO createRecord(Habit habit, HabitRecordWriteDTO recordDTO) {
        this.evictCache(habit, recordDTO.getEpochDay());
        return habitRecordService.createRecord(habit, recordDTO);
    }
}
