package de.jofoerster.habitsync.dto;

import de.jofoerster.habitsync.model.challenge.ChallengeComputationType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ComputationReadWriteDTO {
    private Double dailyGoal;
    private Double dailyReachableValue;
    private String unit;
    private Integer targetDays;

    private FrequencyTypeDTO frequencyType;
    private Integer frequency;
    private Integer timesPerXDays; //only needed with FrequencyTypeDTO.X_TIMES_PER_Y_DAYS

    private ChallengeComputationType challengeComputationType; //only needed for challenges
}
