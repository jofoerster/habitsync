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

import static de.jofoerster.habitsync.util.EvictionHelper.getCompletionEvictionTimeframe;

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
        LocalDate[] timeframe = getCompletionEvictionTimeframe(habit, date);
        for (LocalDate d = timeframe[0]; !d.isAfter(timeframe[1]); d = d.plusDays(1)) {
            int dayEpoch = (int) d.toEpochDay();
            Objects.requireNonNull(cacheManager.getCache("habitRecordCache"))
                    .evictIfPresent(getCacheKey(habit.getUuid(), dayEpoch));
        }
    }

    @Cacheable(value = "habitRecordCache", key = "#root.target.getCacheKey(#habit.getUuid(), #epochDay)")
    public HabitRecordReadDTO getHabitRecordByHabitAndEpochDay(Habit habit, Integer epochDay) {
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordByParentUuidAndRecordDate(habit.getUuid(), epochDay);
        HabitRecord record;
        if (records != null && !records.isEmpty()) {
            record = records.getFirst();
        } else {
            record = HabitRecord.builder()
                    .parentUuid(habit.getUuid())
                    .recordDate(epochDay)
                    .recordValue(0d)
                    .build();
        }
        return habitRecordService.getApiRecordFromRecord(habit, record);
    }

    public HabitRecordReadDTO createRecord(Habit habit, HabitRecordWriteDTO recordDTO) {
        this.evictCache(habit, recordDTO.getEpochDay());
        return habitRecordService.createRecord(habit, recordDTO);
    }
}
