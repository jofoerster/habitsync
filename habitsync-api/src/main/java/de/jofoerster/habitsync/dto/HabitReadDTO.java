package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitReadDTO {
    private String uuid;
    private AccountReadDTO account;
    private String name;
    private Integer color; // 1-10

    private Double sortPosition;

    private ComputationReadWriteDTO progressComputation;

    private Double currentPercentage;

    private String currentMedal; // ascii code of medal character if fetched via connected habits

    private Boolean isChallengeHabit;

    private Long synchronizedSharedHabitId; // share code of the shared habit if this habit is syncronized with a shared habit

    private NotificationFrequencyDTO notificationFrequency;
}
