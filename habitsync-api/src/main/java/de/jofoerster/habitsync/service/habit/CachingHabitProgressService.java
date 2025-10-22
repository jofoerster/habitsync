package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitRecord;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

import static de.jofoerster.habitsync.util.EvictionHelper.getCompletionEvictionTimeframe;

@Service
public class CachingHabitProgressService {

    private final HabitRecordSupplier recordsSupplier;
    private final CacheManager cacheManager;

    public CachingHabitProgressService(HabitRecordRepository habitRecordRepository,
                                       CacheManager cacheManager) {
        this.recordsSupplier = new HabitRecordSupplier(habitRecordRepository);
        this.cacheManager = cacheManager;
    }

    public String getCacheKey(Habit habit, int epochDay) {
        return habit.getUuid() + "_" + epochDay;
    }

    public String getCacheKey(Habit habit, LocalDate date) {
        return getCacheKey(habit, (int) date.toEpochDay());
    }

    public String getCacheKey(Habit habit) {
        return getCacheKey(habit, (int) LocalDate.now().toEpochDay());
    }

    public void onHabitChanged(Habit habit, int epochDay) {
        LocalDate[] timeframe = getCompletionEvictionTimeframe(habit, LocalDate.ofEpochDay(epochDay));
        for (int i = (int) timeframe[0].toEpochDay(); i <= timeframe[1].toEpochDay(); i++) {
            String key = getCacheKey(habit, i);
            Objects.requireNonNull(cacheManager.getCache("habitCompletionCache")).evictIfPresent(key);
        }
        for (int i = epochDay; i < epochDay + habit.getTargetDays() && i <= LocalDate.now().toEpochDay(); i++) {
            String key = getCacheKey(habit, i);
            Objects.requireNonNull(cacheManager.getCache("habitProgressCache")).evictIfPresent(key);
            Objects.requireNonNull(cacheManager.getCache("habitProgressCacheNoFuture")).evictIfPresent(key);
        }
    }

    @Cacheable(value = "habitProgressCache", key = "#root.target.getCacheKey(#habit, #localDate)")
    public double getCompletionPercentageAtDate(Habit habit, LocalDate localDate) {
        return getCompletionPercentageAtDateWithValuesInRange(habit, habit, localDate, null, null, true);
    }

    @Cacheable(value = "habitProgressCacheNoFuture", key = "#root.target.getCacheKey(#habit, #localDate)")
    public double getCompletionPercentageAtDateWithoutFuture(Habit habit, LocalDate localDate) {
        return getCompletionPercentageAtDateWithValuesInRange(habit, habit, localDate, null, null, false);
    }

    @Cacheable(value = "habitProgressCache", key = "#root.target.getCacheKey(#habit)")
    public double getCompletionPercentage(Habit habit) {
        return getCompletionPercentageAtDateWithValuesInRange(habit, habit, LocalDate.now(), null, null, true);
    }

    public double getCompletionPercentageAtDate(Habit habit, Habit habitToUseValuesOf, LocalDate localDate) {
        if (habit == null) {
            habit = habitToUseValuesOf;
        }
        return getCompletionPercentageAtDateWithValuesInRange(habit, habitToUseValuesOf, localDate, null, null, true);
    }

    public double getCompletionPercentageAtDateWithValuesInRange(Habit habit, Habit habitToUseValuesOf,
                                                                 LocalDate localDate,
                                                                 LocalDate forcedStartDate, LocalDate forcedEndDate,
                                                                 boolean lookIntoFuture) {
        if (habit.getTargetDays() == 0 || habit.getFreqCustom() == null ||
                habit.getFreqCustom().isEmpty()) {
            return 0d;
        }
        LocalDate endDate = localDate;
        LocalDate startDate = endDate.minusDays(habit.getTargetDays() - 1);

        double completionPercentage = getCompletionPercentage(habit, habitToUseValuesOf, forcedStartDate,
                forcedEndDate, startDate, endDate);

        if (!lookIntoFuture) {
            return completionPercentage;
        }

        switch (habit.getFreqType()) {
            case 1 -> {
                endDate = endDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                startDate = endDate.minusDays(habit.getTargetDays());
            }
            case 2 -> {
                endDate = endDate.plusMonths(1).withDayOfMonth(1).minusDays(1);
                startDate = endDate.minusDays(habit.getTargetDays());
            }
            case 3 -> {
                return completionPercentage;
            }
            default -> throw new IllegalArgumentException("Invalid frequency type: " + habit.getFreqType());
        }

        return Math.max(completionPercentage,
                getCompletionPercentage(habit, habitToUseValuesOf, forcedStartDate,
                        forcedEndDate, startDate, endDate));
    }

    public double getCompletionPercentage(Habit configHabit, Habit habitToUseRecordsOf,
                                          LocalDate forcedStartDate, LocalDate forcedEndDate, LocalDate startDate,
                                          LocalDate endDate) {
        if (configHabit.getTargetDays() == 0 || configHabit.getFreqCustom() == null ||
                configHabit.getFreqCustom().isEmpty()) {
            return 0d;
        }

        if (configHabit.getFreqType() == 1) {
            return calculateWeeklyAchievement(startDate, endDate, configHabit.getReachableDailyValue(),
                    configHabit.parseFrequencyValue(),
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate, configHabit.getIsNegative(),
                    configHabit.getDayFilterWhitelistAsList()).get("percentage");
        } else if (configHabit.getFreqType() == 2) {
            return calculateMonthlyAchievement(startDate, endDate, configHabit.getReachableDailyValue(),
                    configHabit.parseFrequencyValue(),
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate, configHabit.getIsNegative(),
                    configHabit.getDayFilterWhitelistAsList()).get("percentage");
        } else if (configHabit.getFreqType() == 3) {
            int[] customFreq = configHabit.parseCustomFrequency();
            return calculateCustomPeriodAchievement(startDate, endDate, configHabit.getReachableDailyValue(),
                    customFreq[0],
                    customFreq[1],
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate, configHabit.getIsNegative(),
                    configHabit.getDayFilterWhitelistAsList()).get("percentage");
        } else {
            throw new IllegalArgumentException("Invalid frequency type: " + configHabit.getFreqType());
        }
    }

    public double getTotalAchievement(Habit configHabit, Habit habitToUseRecordsOf) {
        return getTotalAchievement(configHabit, habitToUseRecordsOf, null, null);
    }

    public double getTotalAchievement(Habit configHabit, Habit habitToUseRecordsOf,
                                      LocalDate forcedStartDate,
                                      LocalDate forcedEndDate) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(configHabit.getTargetDays());

        if (configHabit.getFreqType() == 1) {
            return calculateWeeklyAchievement(startDate, endDate, configHabit.getReachableDailyValue(),
                    configHabit.parseFrequencyValue(),
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate, configHabit.getIsNegative(),
                    configHabit.getDayFilterWhitelistAsList()).get(
                    "totalAchievement");
        } else if (configHabit.getFreqType() == 2) {
            return calculateMonthlyAchievement(startDate, endDate, configHabit.getReachableDailyValue(),
                    configHabit.parseFrequencyValue(),
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate, configHabit.getIsNegative(),
                    configHabit.getDayFilterWhitelistAsList()).get(
                    "totalAchievement");
        } else if (configHabit.getFreqType() == 3) {
            int[] customFreq = configHabit.parseCustomFrequency();
            return calculateCustomPeriodAchievement(startDate, endDate, configHabit.getReachableDailyValue(),
                    customFreq[0],
                    customFreq[1],
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate, configHabit.getIsNegative(),
                    configHabit.getDayFilterWhitelistAsList()).get(
                    "totalAchievement");
        } else {
            throw new IllegalArgumentException("Invalid frequency type: " + configHabit.getFreqType());
        }
    }

    private Map<String, Double> calculateWeeklyAchievement(LocalDate startDate, LocalDate endDate, double daily_goal,
                                                           int timesPerWeek, Habit habitToUseRecordsOf,
                                                           LocalDate forcedStartDate,
                                                           LocalDate forcedEndDate, boolean isNegative,
                                                           List<Integer> weekdayFilterWhitelist) {
        LocalDate weekStart = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = endDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        List<HabitRecord> records =
                getHabitRecords(habitToUseRecordsOf, forcedStartDate, forcedEndDate, weekStart, weekdayFilterWhitelist);

        double totalAchievement = 0;
        double totalWeight = 0;

        while (weekStart.isBefore(weekEnd) || weekStart.equals(weekEnd)) {
            LocalDate periodStart = weekStart;
            LocalDate periodEnd = weekStart.plusDays(6);

            LocalDate periodStartReal = periodStart;
            LocalDate periodEndReal = periodEnd;

            if (periodStart.isBefore(startDate)) {
                periodStartReal = startDate;
            }
            if (periodEnd.isAfter(endDate)) {
                periodEndReal = endDate;
            }

            double daysInTargetPeriod = ChronoUnit.DAYS.between(periodStartReal, periodEndReal) + 1;
            double weekWeight = daysInTargetPeriod / 7.0;
            totalWeight += weekWeight;

            List<LocalDate> daysInWeek = getDatesInRange(periodStart, periodEnd);
            double achievedDays = countAchievedDays(daysInWeek, daily_goal, records, isNegative);

            double weekAchievementPercentage = Math.min(1.0, achievedDays / timesPerWeek);
            totalAchievement += weekAchievementPercentage * weekWeight;

            weekStart = weekStart.plusWeeks(1);
        }
        return Map.of("percentage", totalWeight > 0 ? (totalAchievement / totalWeight) * 100 : 0, "totalAchievement",
                totalAchievement);
    }

    private Map<String, Double> calculateMonthlyAchievement(LocalDate startDate, LocalDate endDate, double daily_goal,
                                                            int timesPerMonth,
                                                            Habit habitToUseRecordsOf, LocalDate forcedStartDate,
                                                            LocalDate forcedEndDate, boolean isNegative,
                                                            List<Integer> weekdayFilterWhitelist) {
        LocalDate monthStart = startDate.withDayOfMonth(1);

        List<HabitRecord> records =
                getHabitRecords(habitToUseRecordsOf, forcedStartDate, forcedEndDate, monthStart,
                        weekdayFilterWhitelist);


        double totalAchievementComplete = records.stream().map(HabitRecord::getRecordValue).reduce(0.0, Double::sum);
        double totalAchievement = 0;
        double totalWeight = 0;

        while (!monthStart.isAfter(endDate)) {
            LocalDate periodStart = monthStart;
            LocalDate periodEnd = monthStart.plusMonths(1)
                    .minusDays(1);

            LocalDate periodStartReal = periodStart;
            LocalDate periodEndReal = periodEnd;

            if (periodStart.isBefore(startDate)) {
                periodStartReal = startDate;
            }
            if (periodEnd.isAfter(endDate)) {
                periodEndReal = endDate;
            }

            int daysInMonth = monthStart.lengthOfMonth();
            double daysInTargetPeriod = ChronoUnit.DAYS.between(periodStartReal, periodEndReal) + 1;
            double monthWeight = daysInTargetPeriod / daysInMonth;
            totalWeight += monthWeight;

            List<LocalDate> daysInMonthList = getDatesInRange(periodStart, periodEnd);
            double achievedDays = countAchievedDays(daysInMonthList, daily_goal, records, isNegative);

            double monthAchievementPercentage = Math.min(1.0, achievedDays / timesPerMonth);

            totalAchievement += monthAchievementPercentage * monthWeight;

            monthStart = monthStart.plusMonths(1);
        }

        return Map.of("percentage", totalWeight > 0 ? (totalAchievement / totalWeight) * 100 : 0, "totalAchievement",
                totalAchievementComplete);
    }

    private Map<String, Double> calculateCustomPeriodAchievement(LocalDate startDate, LocalDate endDate,
                                                                 double daily_goal, int times, int days,
                                                                 Habit habitToUseRecordsOf, LocalDate forcedStartDate,
                                                                 LocalDate forcedEndDate, boolean isNegative,
                                                                 List<Integer> weekdayFilterWhitelist) {
        LocalDate periodStartBeforeTarget = startDate.minusDays(days - 1);

        List<HabitRecord> records =
                getHabitRecords(habitToUseRecordsOf, forcedStartDate, forcedEndDate, periodStartBeforeTarget,
                        weekdayFilterWhitelist);

        Map<Integer, HabitRecord> recordMap = records.stream()
                .collect(Collectors.toMap(HabitRecord::getRecordDate, record -> record,
                        (existing, replacement) -> existing));

        List<Double> achievementOfDay = new ArrayList<>();
        double totalAchievement = 0;

        for (LocalDate date = startDate; date.isBefore(endDate.plusDays(1)); date = date.plusDays(1)) {
            long timesNeeded =
                    forcedStartDate != null && forcedStartDate.isBefore(date) ?
                            Math.min(date.toEpochDay() - forcedStartDate.toEpochDay() + 1, times) :
                            times;
            achievementOfDay.add(
                    getCustomPeriodCompletionForDay(date, (int) timesNeeded, days, daily_goal, recordMap, isNegative));
            HabitRecord record = recordMap.get((int) date.toEpochDay());
            totalAchievement += record != null ? record.getRecordValue() : 0;
        }

        Double averageAchievement = achievementOfDay.stream().collect(Collectors.averagingDouble(Double::doubleValue));

        return Map.of("percentage", averageAchievement * 100, "totalAchievement",
                totalAchievement);
    }

    private List<HabitRecord> getHabitRecords(Habit habitToUseRecordsOf, LocalDate forcedStartDate,
                                              LocalDate forcedEndDate, LocalDate since,
                                              List<Integer> weekdayFilterWhitelist) {
        List<HabitRecord> records;
        if (forcedStartDate != null && forcedEndDate != null) {
            records = recordsSupplier.getHabitRecordsInRange(habitToUseRecordsOf, forcedStartDate, forcedEndDate);
        } else {
            records = recordsSupplier.getHabitRecords(habitToUseRecordsOf, since);
        }
        if (weekdayFilterWhitelist != null && !weekdayFilterWhitelist.isEmpty()) {
            records = records.stream()
                    .filter(record -> weekdayFilterWhitelist.contains(
                            record.getRecordDateAsDate().getDayOfWeek().getValue()))
                    .collect(Collectors.toList());
        }
        return records;
    }

    private Double getCustomPeriodCompletionForDay(LocalDate date, int times, int days, double dailyReachableValue,
                                                   List<HabitRecord> records, boolean isNegative) {
        Map<Integer, HabitRecord> recordMap = records.stream()
                .collect(Collectors.toMap(HabitRecord::getRecordDate, record -> record,
                        (existing, replacement) -> existing));
        return getCustomPeriodCompletionForDay(date, times, days, dailyReachableValue, recordMap, isNegative);
    }

    private Double getCustomPeriodCompletionForDay(LocalDate date, int times, int days, double dailyReachableValue,
                                                   Map<Integer, HabitRecord> recordMap, boolean isNegative) {
        int endDate = (int) date.toEpochDay();
        int startDate = endDate - days + 1;

        double goal = dailyReachableValue * times;
        double currentValue = 0;

        for (int i = startDate; i <= endDate; i++) {
            HabitRecord record = recordMap.get(i);
            if (!isNegative) {
                if (record != null) {
                    currentValue += Math.min(record.getRecordValue(), dailyReachableValue);
                }
            } else {
                if (record == null) {
                    currentValue += 1.0;
                } else {
                    currentValue += record.getRecordValue() <= dailyReachableValue ? 1.0 : 0.0;
                }
            }
        }
        if (isNegative) {
            return Math.min(1.0, currentValue); //goal is always 1 in negative habits
        }
        return Math.min(1.0, currentValue / goal);
    }

    private double countAchievedDays(List<LocalDate> days, double daily_goal, List<HabitRecord> records,
                                     boolean isNegative) {
        Map<LocalDate, Double> valuesByDay = removeDuplicateDates(records).stream()
                .collect(Collectors.toMap(HabitRecord::getRecordDateAsDate, HabitRecord::getRecordValue));
        double totalAchievement = 0;

        for (LocalDate day : days) {
            double value = valuesByDay.get(day) != null ? valuesByDay.get(day) : 0;
            double achievementRatio;
            if (isNegative) {
                achievementRatio = value <= daily_goal ? 1.0 : 0.0;
            } else {
                achievementRatio = Math.min(1.0, value / daily_goal);
            }
            totalAchievement += achievementRatio;
        }

        return totalAchievement;
    }

    private List<LocalDate> getDatesInRange(LocalDate start, LocalDate end) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = start;

        while (!current.isAfter(end) && !current.isAfter(LocalDate.now())) {
            dates.add(current);
            current = current.plusDays(1);
        }

        return dates;
    }

    public Double getMaxValue(Habit habit, LocalDate startDate, LocalDate endDate) {
        List<HabitRecord> habitRecordList = getHabitRecords(habit, startDate, endDate, null, null);
        return habitRecordList.stream()
                .map(HabitRecord::getRecordValue)
                .max(Double::compareTo)
                .orElse(0d);
    }

    @Cacheable(value = "habitCompletionCache", key = "#root.target.getCacheKey(#habit, #date)")
    public boolean getCompletionForDay(LocalDate date, Habit habit) {
        return getCompletionForDay(date, habit, habit);
    }

    public boolean getCompletionForDay(LocalDate date, Habit configHabit, Habit habitToUseValuesOf) {
        if (configHabit.getFreqType() == null || configHabit.getDailyGoal() == null) {
            return false;
        }
        return switch (configHabit.getFreqType()) {
            case 1:
                LocalDate weekStart = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate weekEnd = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                List<HabitRecord> habitRecordsWeek =
                        getHabitRecords(habitToUseValuesOf, weekStart, weekEnd, null,
                                configHabit.getDayFilterWhitelistAsList());
                yield configHabit.parseFrequencyValue() <=
                        countAchievedDays(getDatesInRange(weekStart, weekEnd), configHabit.getReachableDailyValue(),
                                habitRecordsWeek, configHabit.getIsNegative());
            case 2:
                LocalDate monthStart = date.withDayOfMonth(1);
                LocalDate monthEnd = YearMonth.from(date).atEndOfMonth();
                List<HabitRecord> habitRecordsMonth =
                        getHabitRecords(habitToUseValuesOf, monthStart, monthEnd, null,
                                configHabit.getDayFilterWhitelistAsList());
                yield configHabit.parseFrequencyValue() <=
                        countAchievedDays(getDatesInRange(monthStart, monthEnd), configHabit.getReachableDailyValue(),
                                habitRecordsMonth, configHabit.getIsNegative());
            case 3:
                LocalDate customStart = date.minusDays(configHabit.parseCustomFrequency()[1]).plusDays(1);
                List<HabitRecord> habitRecordCustom =
                        getHabitRecords(habitToUseValuesOf, customStart, date, null,
                                configHabit.getDayFilterWhitelistAsList());
                yield 1 == getCustomPeriodCompletionForDay(date, configHabit.parseCustomFrequency()[0],
                        configHabit.parseCustomFrequency()[1],
                        configHabit.getReachableDailyValue(), habitRecordCustom, configHabit.getIsNegative());
            default:
                yield false;
        };
    }

    public static List<HabitRecord> removeDuplicateDates(List<HabitRecord> records) {
        Set<LocalDate> seenDates = new HashSet<>();
        return records.stream()
                .filter(hrecord -> seenDates.add(hrecord.getRecordDateAsDate()))
                .toList();
    }
}
