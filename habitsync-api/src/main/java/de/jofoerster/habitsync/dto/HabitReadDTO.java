package de.jofoerster.habitsync.dto;

import de.jofoerster.habitsync.model.habit.HabitRecord;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class HabitReadDTO {
    private String uuid;
    private AccountReadDTO account;
    private String name;
    private Integer color; // 1-10

    private Double sortPosition;

    private String group;

    private ComputationReadWriteDTO progressComputation;

    private Double currentPercentage;

    private String currentMedal; // ascii code of medal character if fetched via connected habits

    private Boolean isChallengeHabit;

    private Long synchronizedSharedHabitId; // share code of the shared habit if this habit is syncronized with a shared habit

    private NotificationConfigDTO notificationFrequency;

    private Boolean hasConnectedHabits;

    private HabitNumberModalConfigDTO numberModalConfig;

    private List<HabitRecordReadDTO> records;
}
