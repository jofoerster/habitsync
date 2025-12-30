package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitWriteDTO {
    private String name;
    private Integer color; // 1-10
    private String group;

    private ComputationReadWriteDTO progressComputation;
}
