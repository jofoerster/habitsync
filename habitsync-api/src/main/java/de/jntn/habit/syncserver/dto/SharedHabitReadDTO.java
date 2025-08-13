package de.jntn.habit.syncserver.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SharedHabitReadDTO {
    private AccountReadDTO owner;
    private List<HabitReadDTO> habits;
    private String shareCode;
    private Long id;
    private String title;
    private String description;
    private Boolean allowEditingOfAllUsers;
    private Long creationTime;
    private ComputationReadWriteDTO progressComputation;
}
