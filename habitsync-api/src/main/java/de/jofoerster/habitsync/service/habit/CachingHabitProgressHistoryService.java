package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.dto.PercentageHistoryDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CachingHabitProgressHistoryService {
    private final CachingHabitProgressService cachingHabitProgressService;
    private final CacheManager cacheManager;

    @Cacheable(value = "percentageHistory", key = "#root.target.getCacheKey(#habit, #year, #month)")
    public PercentageHistoryDTO getPercentageHistoryForMonth(Habit habit, Year year, int month) {
        LocalDate startDate = LocalDate.of(year.getValue(), month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        Map<Integer, Double> dailyPercentages = new HashMap<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            double percentage = cachingHabitProgressService.getCompletionPercentageAtDateWithoutFuture(habit, date);
            dailyPercentages.put((int) date.toEpochDay(), percentage);
        }
        return PercentageHistoryDTO.builder()
                .month(String.format("%04d-%02d", year.getValue(), month))
                .dailyPercentages(dailyPercentages)
                .build();
    }

    @Async
    public void evictCacheForHabit(Habit habit, Integer epochDay) {
        YearMonth start = YearMonth.from(LocalDate.ofEpochDay(epochDay));
        YearMonth end = YearMonth.from(LocalDate.ofEpochDay(epochDay).plusDays(habit.getTargetDays()));
        for (YearMonth month = start; !month.isAfter(end); month = month.plusMonths(1)) {
            Objects.requireNonNull(cacheManager.getCache("percentageHistory"))
                    .evictIfPresent(getCacheKey(habit, Year.of(month.getYear()), month.getMonthValue()));
        }
    }

    public String getCacheKey(Habit habit, Year year, int month) {
        return habit.getUuid() + "-" + year.getValue() + "-" + month;
    }
}
