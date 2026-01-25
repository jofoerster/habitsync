package de.jofoerster.habitsync.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import de.jofoerster.habitsync.model.habit.HabitStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitWriteDTO {
    private String name;
    private Integer color; // 1-10
    private String group;

    @JsonProperty(required = false)
    private HabitStatus status;

    private ComputationReadWriteDTO progressComputation;
}
