package de.jofoerster.habitsync.model.habit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import de.jofoerster.habitsync.dto.ComputationReadWriteDTO;
import de.jofoerster.habitsync.dto.FrequencyTypeDTO;
import de.jofoerster.habitsync.dto.HabitWriteDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.util.HabitRecordsDeserializer;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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
    private Double dailyGoal; //"Daily default"

    private DefaultDailyOperation defaultDailyOperation;

    @JsonProperty("daily_goal_unit")
    private String dailyGoalUnit;

    @JsonProperty("daily_goal_extra")
    private Double dailyGoalExtra; // "Real" daily goal

    private Boolean isNegative;

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

    private String group;

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

    @JsonIgnore
    private String weekdayFilterWhitelist; // Comma separated list of weekdays (1-7)

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

    public LocalDate getStartDateAsDate() {
        return LocalDate.ofEpochDay(startDate);
    }

    public List<Integer> getDayFilterWhitelistAsList() {
        if (weekdayFilterWhitelist == null || weekdayFilterWhitelist.isEmpty()) {
            return List.of();
        }
        String[] parts = weekdayFilterWhitelist.split(";");
        return java.util.Arrays.stream(parts)
                .map(Integer::parseInt)
                .toList();
    }

    public void setDayFilterWhitelistFromList(List<Integer> whitelist) {
        if (whitelist == null || whitelist.isEmpty()) {
            this.weekdayFilterWhitelist = "";
            return;
        }
        this.weekdayFilterWhitelist = whitelist.stream()
                .map(String::valueOf)
                .reduce((a, b) -> a + ";" + b)
                .orElse("");
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

    public boolean getIsNegative() {
        return this.isNegative != null ? this.isNegative : false;
    }

    public DefaultDailyOperation getDefaultDailyOperation() {
        return this.defaultDailyOperation == null ? DefaultDailyOperation.SET
                : this.defaultDailyOperation;
    }

    public String getDailyDefaultValueString() {
        String prefix = switch (this.getDefaultDailyOperation()) {
            case SET -> "";
            case ADD -> "+";
            case SUBTRACT -> "-";
        };
        return this.getDailyGoal() != null ? prefix + this.getDailyGoal() :
                prefix + this.getReachableDailyValue();
    }

    public void copyAttributesFromHabit(Habit iH, boolean isSharedHabitSync) {
        if (iH.dailyGoal != null && !isSharedHabitSync) {
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
        if (iH.getDayFilterWhitelistAsList() != null) {
            setDayFilterWhitelistFromList(iH.getDayFilterWhitelistAsList());
        }
        if (iH.name != null && !iH.name.isBlank()) {
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
        if (dailyGoalExtra == null || (dailyGoalExtra == 0 && !getIsNegative())) {
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
                .dailyDefault(this.getDailyDefaultValueString())
                .dailyReachableValue(
                        this.getReachableDailyValue() != null ? this.getReachableDailyValue() :
                                this.getDailyGoal())
                .isNegative(this.isNegative)
                .weekdayFilterWhitelist(this.getDayFilterWhitelistAsList())
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
        String dailyDefault =
                computationReadWriteDTO.getDailyDefault() == null || computationReadWriteDTO.getDailyDefault().isBlank() ?
                        String.valueOf(computationReadWriteDTO.getDailyReachableValue()) :
                        computationReadWriteDTO.getDailyDefault();
        this.dailyGoal = Math.abs(Double.parseDouble(dailyDefault));
        if (!dailyDefault.equals("1")) {
            this.defaultDailyOperation = switch (dailyDefault.charAt(0)) {
                case '+' -> DefaultDailyOperation.ADD;
                case '-' -> DefaultDailyOperation.SUBTRACT;
                default -> DefaultDailyOperation.SET;
            };
        } else {
            this.defaultDailyOperation = DefaultDailyOperation.SET;
        }
        this.dailyGoalExtra = computationReadWriteDTO.getDailyReachableValue();
        if (this.dailyGoalExtra == null) {
            this.dailyGoalExtra = this.dailyGoal;
        }
        this.targetDays = computationReadWriteDTO.getTargetDays();
        this.isNegative = computationReadWriteDTO.getIsNegative() != null && computationReadWriteDTO.getIsNegative();
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

        if (computationReadWriteDTO.getWeekdayFilterWhitelist() != null) {
            setDayFilterWhitelistFromList(computationReadWriteDTO.getWeekdayFilterWhitelist());
        }
    }

    public Integer getFreqType() {
        return freqType != null ? freqType : 1;
    }

    public FrequencyTypeDTO getParsedFrequencyType() {
        return switch (this.getFreqType()) {
            case 1 -> FrequencyTypeDTO.WEEKLY;
            case 2 -> FrequencyTypeDTO.MONTHLY;
            case 3 -> FrequencyTypeDTO.X_TIMES_PER_Y_DAYS;
            default -> null;
        };
    }
}