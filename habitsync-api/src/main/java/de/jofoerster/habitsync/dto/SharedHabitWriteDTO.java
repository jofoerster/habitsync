package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SharedHabitWriteDTO {
    private String title;
    private String description;
    private String habitUuid;
    private Boolean allowEditingOfAllUsers;
    private ComputationReadWriteDTO progressComputation;
}
