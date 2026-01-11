package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitReadUuidDTO {
    private String uuid;
    private String groupName;
    private Double sortPosition;
}
