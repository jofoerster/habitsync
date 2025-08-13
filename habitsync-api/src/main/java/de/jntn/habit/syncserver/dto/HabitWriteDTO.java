package de.jntn.habit.syncserver.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitWriteDTO {
    private String name;
    private Integer color; // 1-10

    private ComputationReadWriteDTO progressComputation;
}
