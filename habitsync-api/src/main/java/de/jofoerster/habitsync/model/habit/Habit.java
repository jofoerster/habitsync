package de.jofoerster.habitsync.model.habit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import de.jofoerster.habitsync.dto.ComputationReadWriteDTO;
import de.jofoerster.habitsync.dto.FrequencyTypeDTO;
import de.jofoerster.habitsync.dto.HabitWriteDTO;
import de.jofoerster.habitsync.dto.NotificationFrequencyDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.util.HabitRecordsDeserializer;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@EqualsAndHashCode(exclude = {"sharedHabits", "account"})
@ToString(exclude = {"sharedHabits", "account"})
@Data
@Entity
@Table(name = "habits")
public class Habit {

    @JsonIgnore
    @ManyToOne
    private Account account;

    @Id
    @Column(unique = true)
    private String uuid;

    @JsonProperty("create_t")
    private Long createT;

    @JsonProperty("modify_t")
    private Long modifyT;

    private Integer type;
    private Integer status = 1; // 1 = active, 2 = deleted, 3 = archived
    private String name;

    @JsonProperty("desc")
    private String desc;

    private Integer color;

    @JsonProperty("daily_goal")
    private Double dailyGoal;

    @JsonProperty("daily_goal_unit")
    private String dailyGoalUnit;

    @JsonProperty("daily_goal_extra")
    private Double dailyGoalExtra;

    @JsonProperty("freq_type")
    private Integer freqType;

    @JsonProperty("freq_custom")
    private String freqCustom;

    @JsonProperty("start_date")
    private Integer startDate;

    @JsonProperty("target_days")
    private Integer targetDays;

    @JsonProperty("reminder_custom")
    @Column(columnDefinition = "TEXT")
    private String reminderCustom;

    @JsonProperty("reminder_quest")
    private String reminderQuest;

    @JsonProperty("sort_position")
    private Double sortPosition;

    @ManyToMany(mappedBy = "habits")
    @JsonIgnore
    private List<SharedHabit> sharedHabits;

    // Special habit only for computation of challenge progress
    @JsonIgnore
    private boolean challengeHabit = false;

    @JsonIgnore
    private HabitType habitType = HabitType.INTERNAL;

    @JsonIgnore
    private Long connectedSharedHabitId;

    // Only used for importing
    @Transient
    @JsonDeserialize(using = HabitRecordsDeserializer.class)
    private List<HabitRecord> records;

    public Habit() {
        this.uuid = UUID.randomUUID()
                .toString();
        this.createT = System.currentTimeMillis() / 1000;
        this.modifyT = this.createT;
    }

    public static List<HabitRecord> removeDuplicateDates(List<HabitRecord> records) {
        Set<LocalDate> seenDates = new HashSet<>();
        return records.stream()
                .filter(hrecord -> seenDates.add(hrecord.getRecordDateAsDate()))
                .toList();
    }

    public LocalDate getModificationTime() {
        return LocalDate.ofInstant(Instant.ofEpochSecond(this.getModifyT()), ZoneId.systemDefault());
    }

    public LocalDate getStartDateAsDate() {
        return LocalDate.ofEpochDay(startDate);
    }

    public int getCompletionPercentageInt(HabitRecordSupplier habitRecordSupplier) {
        return (int) Math.ceil(this.getCompletionPercentage(habitRecordSupplier));
    }

    public double getCompletionPercentage(HabitRecordSupplier recordSupplier) {
        return getCompletionPercentage(recordSupplier, this);
    }

    public double getCompletionPercentage(HabitRecordSupplier recordsSupplier, Habit habitToUseRecordsOf) {
        return getCompletionPercentage(recordsSupplier, habitToUseRecordsOf, null, null);
    }

    public double getCompletionPercentage(HabitRecordSupplier recordsSupplier, Habit habitToUseRecordsOf,
                                          LocalDate forcedStartDate, LocalDate forcedEndDate) {
        if (targetDays == null || targetDays == 0 || freqCustom == null || freqCustom.isEmpty()) {
            return 0d;
        }
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(targetDays - 1);

        double completionPercentage = getCompletionPercentage(recordsSupplier, habitToUseRecordsOf, forcedStartDate,
                forcedEndDate, endDate, startDate);

        switch (freqType) {
            case 1 -> {
                endDate = endDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                startDate = endDate.minusDays(targetDays);
            }
            case 2 -> {
                endDate = endDate.plusMonths(1).withDayOfMonth(1).minusDays(1);
                startDate = endDate.minusDays(targetDays);
            }
            case 3 -> {
                return completionPercentage;
            }
            default -> throw new IllegalArgumentException("Invalid frequency type: " + freqType);
        }

        return Math.max(completionPercentage,
                getCompletionPercentage(recordsSupplier, habitToUseRecordsOf, forcedStartDate,
                        forcedEndDate, endDate, startDate));
    }

    public double getCompletionPercentage(HabitRecordSupplier recordsSupplier, Habit habitToUseRecordsOf,
                                          LocalDate forcedStartDate, LocalDate forcedEndDate, LocalDate endDate,
                                          LocalDate startDate) {
        if (targetDays == null || targetDays == 0 || freqCustom == null || freqCustom.isEmpty()) {
            return 0d;
        }

        if (freqType == 1) {
            return calculateWeeklyAchievement(startDate, endDate, getReachableDailyValue(), parseFrequencyValue(),
                    recordsSupplier,
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate).get("percentage");
        } else if (freqType == 2) {
            return calculateMonthlyAchievement(startDate, endDate, getReachableDailyValue(), parseFrequencyValue(),
                    recordsSupplier,
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate).get("percentage");
        } else if (freqType == 3) {
            int[] customFreq = parseCustomFrequency();
            return calculateCustomPeriodAchievement(startDate, endDate, getReachableDailyValue(), customFreq[0],
                    customFreq[1],
                    recordsSupplier, habitToUseRecordsOf, forcedStartDate, forcedEndDate).get("percentage");
        } else {
            throw new IllegalArgumentException("Invalid frequency type: " + freqType);
        }
    }

    public double getTotalAchievement(HabitRecordSupplier recordsSupplier, Habit habitToUseRecordsOf) {
        return getTotalAchievement(recordsSupplier, habitToUseRecordsOf, null, null);
    }

    public double getTotalAchievement(HabitRecordSupplier recordsSupplier, Habit habitToUseRecordsOf,
                                      LocalDate forcedStartDate,
                                      LocalDate forcedEndDate) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(targetDays);

        if (freqType == 1) {
            return calculateWeeklyAchievement(startDate, endDate, getReachableDailyValue(), parseFrequencyValue(),
                    recordsSupplier,
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate).get("totalAchievement");
        } else if (freqType == 2) {
            return calculateMonthlyAchievement(startDate, endDate, getReachableDailyValue(), parseFrequencyValue(),
                    recordsSupplier,
                    habitToUseRecordsOf, forcedStartDate, forcedEndDate).get("totalAchievement");
        } else if (freqType == 3) {
            int[] customFreq = parseCustomFrequency();
            return calculateCustomPeriodAchievement(startDate, endDate, getReachableDailyValue(), customFreq[0],
                    customFreq[1],
                    recordsSupplier, habitToUseRecordsOf, forcedStartDate, forcedEndDate).get("totalAchievement");
        } else {
            throw new IllegalArgumentException("Invalid frequency type: " + freqType);
        }
    }

    public Integer parseFrequencyValue() {
        try {
            return freqCustom != null && !freqCustom.isEmpty() ?
                    Integer.parseInt(freqCustom.replaceAll("[\\[\\]]", "")) :
                    1;
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    public int[] parseCustomFrequency() {
        if (freqCustom == null || freqCustom.isEmpty()) {
            return new int[]{1, 1};
        }
        String[] parts = freqCustom.replaceAll("[\\[\\]]", "")
                .split(",");
        if (parts.length != 2) {
            return new int[]{1, 1};
        }
        try {
            return new int[]{Integer.parseInt(parts[0]), Integer.parseInt(parts[1])};
        } catch (Exception e) {
            return new int[]{1, 1};
        }
    }

    private Map<String, Double> calculateWeeklyAchievement(LocalDate startDate, LocalDate endDate, double daily_goal,
                                                           int timesPerWeek, HabitRecordSupplier recordsSupplier,
                                                           Habit habitToUseRecordsOf, LocalDate forcedStartDate,
                                                           LocalDate forcedEndDate) {
        LocalDate weekStart = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = endDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        List<HabitRecord> records;
        if (forcedStartDate != null && forcedEndDate != null) {
            records = recordsSupplier.getHabitRecordsInRange(habitToUseRecordsOf, forcedStartDate, forcedEndDate);
        } else {
            records = recordsSupplier.getHabitRecords(habitToUseRecordsOf, weekStart);
        }

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
            double achievedDays = countAchievedDays(daysInWeek, daily_goal, records);

            double weekAchievementPercentage = Math.min(1.0, achievedDays / timesPerWeek);
            totalAchievement += weekAchievementPercentage * weekWeight;

            weekStart = weekStart.plusWeeks(1);
        }
        return Map.of("percentage", totalWeight > 0 ? (totalAchievement / totalWeight) * 100 : 0, "totalAchievement",
                totalAchievement);
    }

    private Map<String, Double> calculateMonthlyAchievement(LocalDate startDate, LocalDate endDate, double daily_goal,
                                                            int timesPerMonth, HabitRecordSupplier recordsSupplier,
                                                            Habit habitToUseRecordsOf, LocalDate forcedStartDate,
                                                            LocalDate forcedEndDate) {
        LocalDate monthStart = startDate.withDayOfMonth(1);

        List<HabitRecord> records;
        if (forcedStartDate != null && forcedEndDate != null) {
            records = recordsSupplier.getHabitRecordsInRange(habitToUseRecordsOf, forcedStartDate, forcedEndDate);
        } else {
            records = recordsSupplier.getHabitRecords(habitToUseRecordsOf, monthStart);
        }

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
            double achievedDays = countAchievedDays(daysInMonthList, daily_goal, records);

            double monthAchievementPercentage = Math.min(1.0, achievedDays / timesPerMonth);

            totalAchievement += monthAchievementPercentage * monthWeight;

            monthStart = monthStart.plusMonths(1);
        }

        return Map.of("percentage", totalWeight > 0 ? (totalAchievement / totalWeight) * 100 : 0, "totalAchievement",
                totalAchievementComplete);
    }

    private Map<String, Double> calculateCustomPeriodAchievement(LocalDate startDate, LocalDate endDate,
                                                                 double daily_goal, int times, int days,
                                                                 HabitRecordSupplier recordsSupplier,
                                                                 Habit habitToUseRecordsOf, LocalDate forcedStartDate,
                                                                 LocalDate forcedEndDate) {
        LocalDate periodStartBeforeTarget = startDate.minusDays(days - 1);

        List<HabitRecord> records;

        if (forcedStartDate != null && forcedEndDate != null) {
            records = recordsSupplier.getHabitRecordsInRange(habitToUseRecordsOf, forcedStartDate, forcedEndDate);
        } else {
            records = recordsSupplier.getHabitRecords(habitToUseRecordsOf, periodStartBeforeTarget);
        }

        Map<Integer, HabitRecord> recordMap = records.stream()
                .collect(Collectors.toMap(HabitRecord::getRecordDate, record -> record,
                        (existing, replacement) -> existing));

        List<Double> achievementOfDay = new ArrayList<>();
        double totalAchievement = 0;

        for (LocalDate date = startDate; date.isBefore(endDate.plusDays(1)); date = date.plusDays(1)) {
            long timesNeeded =
                    forcedStartDate != null && forcedStartDate.isBefore(date) ? Math.min(date.toEpochDay() - forcedStartDate.toEpochDay() + 1, times) :
                            times;
            achievementOfDay.add(getCustomPeriodCompletionForDay(date, (int) timesNeeded, days, daily_goal, recordMap));
            HabitRecord record = recordMap.get((int) date.toEpochDay());
            totalAchievement += record != null ? record.getRecordValue() : 0;
        }

        Double averageAchievement = achievementOfDay.stream().collect(Collectors.averagingDouble(Double::doubleValue));

        return Map.of("percentage", averageAchievement * 100, "totalAchievement",
                totalAchievement);
    }

    private Double getCustomPeriodCompletionForDay(LocalDate date, int times, int days, double dailyReachableValue,
                                                   List<HabitRecord> records) {
        Map<Integer, HabitRecord> recordMap = records.stream()
                .collect(Collectors.toMap(HabitRecord::getRecordDate, record -> record,
                        (existing, replacement) -> existing));
        return getCustomPeriodCompletionForDay(date, times, days, dailyReachableValue, recordMap);
    }

    private Double getCustomPeriodCompletionForDay(LocalDate date, int times, int days, double dailyReachableValue,
                                                   Map<Integer, HabitRecord> recordMap) {
        int endDate = (int) date.toEpochDay();
        int startDate = endDate - days + 1;

        double goal = dailyReachableValue * times;
        double currentValue = 0;

        for (int i = startDate; i <= endDate; i++) {
            HabitRecord record = recordMap.get(i);
            if (record != null) {
                currentValue += Math.min(record.getRecordValue(), dailyReachableValue);
            }
        }
        return Math.min(1.0, currentValue / goal);
    }

    private double countAchievedDays(List<LocalDate> days, double daily_goal, List<HabitRecord> records) {
        Map<LocalDate, Double> valuesByDay = removeDuplicateDates(records).stream()
                .collect(Collectors.toMap(HabitRecord::getRecordDateAsDate, HabitRecord::getRecordValue));
        double totalAchievement = 0;

        for (LocalDate day : days) {
            double value = valuesByDay.get(day) != null ? valuesByDay.get(day) : 0;
            double achievementRatio = Math.min(1.0, value / daily_goal);
            totalAchievement += achievementRatio;
        }

        return totalAchievement;
    }

    private List<LocalDate> getDatesInRange(LocalDate start, LocalDate end) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = start;

        while (!current.isAfter(end)) {
            dates.add(current);
            current = current.plusDays(1);
        }

        return dates;
    }

    public Double getMaxValue(HabitRecordSupplier recordSupplier, Habit habit, LocalDate startDate, LocalDate endDate) {
        List<HabitRecord> habitRecordList = recordSupplier.getHabitRecordsInRange(habit, startDate, endDate);
        return habitRecordList.stream()
                .map(HabitRecord::getRecordValue)
                .max(Double::compareTo)
                .orElse(0d);
    }

    public boolean isDeleted() {
        return this.status != null && this.status >= 2;
    }

    public double getSortPosition() {
        return this.sortPosition != null ? this.sortPosition : 999;
    }

    public boolean getCompletionForDay(HabitRecordSupplier recordSupplier, int date) {
        LocalDate parsedDate = LocalDate.ofEpochDay(date);
        return getCompletionForDay(recordSupplier, parsedDate);
    }

    public boolean getCompletionForDay(HabitRecordSupplier recordSupplier, int date, Habit habitToUseValuesOf) {
        LocalDate parsedDate = LocalDate.ofEpochDay(date);
        return getCompletionForDay(recordSupplier, parsedDate, habitToUseValuesOf);
    }

    public boolean getCompletionForDay(HabitRecordSupplier recordSupplier, String date) {
        LocalDate parsedDate = LocalDate.parse(date + "." + LocalDate.now()
                .getYear(), DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        return getCompletionForDay(recordSupplier, parsedDate);
    }

    public boolean getCompletionForDay(HabitRecordSupplier recordSupplier, LocalDate date) {
        return getCompletionForDay(recordSupplier, date, this);
    }

    public boolean getCompletionForDay(HabitRecordSupplier recordSupplier, LocalDate date, Habit habitToUseValuesOf) {
        if (this.freqType == null || this.dailyGoal == null) {
            return false;
        }
        return switch (this.freqType) {
            case 1:
                LocalDate weekStart = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate weekEnd = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                List<HabitRecord> habitRecordsWeek =
                        recordSupplier.getHabitRecordsInRange(habitToUseValuesOf, weekStart, weekEnd);
                yield this.parseFrequencyValue() <=
                        countAchievedDays(getDatesInRange(weekStart, weekEnd), this.getReachableDailyValue(),
                                habitRecordsWeek);
            case 2:
                LocalDate monthStart = date.withDayOfMonth(1);
                LocalDate monthEnd = YearMonth.from(date).atEndOfMonth();
                List<HabitRecord> habitRecordsMonth =
                        recordSupplier.getHabitRecordsInRange(habitToUseValuesOf, monthStart, monthEnd);
                yield this.parseFrequencyValue() <=
                        countAchievedDays(getDatesInRange(monthStart, monthEnd), this.getReachableDailyValue(),
                                habitRecordsMonth);
            case 3:
                LocalDate customStart = date.minusDays(parseCustomFrequency()[1]).plusDays(1);
                List<HabitRecord> habitRecordCustom =
                        recordSupplier.getHabitRecordsInRange(habitToUseValuesOf, customStart, date);
                yield 1 == getCustomPeriodCompletionForDay(date, parseCustomFrequency()[0], parseCustomFrequency()[1],
                        this.getReachableDailyValue(), habitRecordCustom);
            default:
                yield false;
        };
    }

    public void copyAttributesFromHabit(Habit iH) {
        if (iH.dailyGoal != null) {
            this.dailyGoal = iH.dailyGoal;
        }
        if (iH.dailyGoalExtra != null) {
            this.dailyGoalExtra = iH.dailyGoalExtra;
        }
        if (iH.dailyGoalUnit != null) {
            this.dailyGoalUnit = iH.dailyGoalUnit;
        }
        if (iH.targetDays != null) {
            this.targetDays = iH.targetDays;
        }
        if (iH.freqType != null) {
            this.freqType = iH.freqType;
        }
        if (iH.freqCustom != null) {
            this.freqCustom = iH.freqCustom;
        }
        if (iH.name != null) {
            this.name = iH.name;
        }
    }

    public int getTargetDays() {
        return this.targetDays != null ? this.targetDays : 1;
    }

    public String getDailyGoalUnit() {
        return this.dailyGoalUnit != null ? this.dailyGoalUnit : "";
    }

    public Double getReachableDailyValue() {
        if (dailyGoalExtra == null || dailyGoalExtra == 0) {
            return getDailyGoal();
        } else {
            return dailyGoalExtra;
        }
    }

    public ComputationReadWriteDTO getApiComputationReadWrite() {
        FrequencyTypeDTO freqType = switch (this.getFreqType()) {
            case 1 -> FrequencyTypeDTO.WEEKLY;
            case 2 -> FrequencyTypeDTO.MONTHLY;
            case 3 -> FrequencyTypeDTO.X_TIMES_PER_Y_DAYS;
            default -> null;
        };
        Integer frequency;
        Integer timesPerXDays = null;
        if (freqType != FrequencyTypeDTO.X_TIMES_PER_Y_DAYS) {
            frequency = parseFrequencyValue();
        } else {
            frequency = parseCustomFrequency()[0];
            timesPerXDays = parseCustomFrequency()[1];
        }

        return ComputationReadWriteDTO.builder()
                .unit(this.getDailyGoalUnit())
                .frequencyType(freqType)
                .frequency(frequency)
                .timesPerXDays(timesPerXDays)
                .targetDays(this.getTargetDays())
                .dailyGoal(this.getDailyGoal() != null ? this.getDailyGoal() : this.getReachableDailyValue())
                .dailyReachableValue(this.getReachableDailyValue() != null ? this.getReachableDailyValue() : this.getDailyGoal())
                .build();
    }

    public void applyChanges(HabitWriteDTO apiHabitWrite) {
        if (apiHabitWrite.getName() != null) {
            this.name = apiHabitWrite.getName();
        }
        if (apiHabitWrite.getColor() != null) {
            this.color = apiHabitWrite.getColor();
        }
        if (apiHabitWrite.getProgressComputation() != null) {
            applyChanges(apiHabitWrite.getProgressComputation());
        }
    }

    public void applyChanges(ComputationReadWriteDTO computationReadWriteDTO) {
        this.dailyGoalUnit = computationReadWriteDTO.getUnit();
        this.dailyGoal = computationReadWriteDTO.getDailyGoal();
        this.dailyGoalExtra = computationReadWriteDTO.getDailyReachableValue();
        if (this.dailyGoalExtra == null) {
            this.dailyGoalExtra = this.dailyGoal;
        }
        if (this.dailyGoal == null) {
            this.dailyGoal = this.dailyGoalExtra;
        }
        this.targetDays = computationReadWriteDTO.getTargetDays();
        if (computationReadWriteDTO.getFrequencyType() != null) {
            switch (computationReadWriteDTO.getFrequencyType()) {
                case WEEKLY -> {
                    this.freqType = 1;
                    this.freqCustom = String.valueOf(computationReadWriteDTO.getFrequency());
                }
                case MONTHLY -> {
                    this.freqType = 2;
                    this.freqCustom = String.valueOf(computationReadWriteDTO.getFrequency());
                }
                case X_TIMES_PER_Y_DAYS -> {
                    this.freqType = 3;
                    this.freqCustom = "[" + computationReadWriteDTO.getFrequency() + ","
                            + computationReadWriteDTO.getTimesPerXDays() + "]";
                }
            }
        } else {
            this.freqType = null;
            this.freqCustom = null;
        }
    }

    public Integer getFreqType() {
        return freqType != null ? freqType : 1;
    }
}