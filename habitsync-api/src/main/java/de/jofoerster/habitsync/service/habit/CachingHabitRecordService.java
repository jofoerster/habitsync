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

    public void evictCache(String habitUuid, int epochDay) {
        Objects.requireNonNull(cacheManager.getCache("habitRecordCache"))
                .evictIfPresent(getCacheKey(habitUuid, epochDay));
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
        this.evictCache(habit.getUuid(), recordDTO.getEpochDay());
        return habitRecordService.createRecord(habit, recordDTO);
    }
}
