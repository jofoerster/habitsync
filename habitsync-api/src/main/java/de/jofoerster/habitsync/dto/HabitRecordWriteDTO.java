package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitRecordWriteDTO {
    private Integer epochDay; //timestamp of record in epoch days
    private Double recordValue;
}
