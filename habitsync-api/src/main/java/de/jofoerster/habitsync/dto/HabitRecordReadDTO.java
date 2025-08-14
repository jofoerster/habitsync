package de.jofoerster.habitsync.dto;

import de.jofoerster.habitsync.model.habit.HabitRecordCompletion;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HabitRecordReadDTO {
    private String uuid;
    private String habitUuid;
    private Integer epochDay; //timestamp of record in epoch days
    private Double recordValue;

    private HabitRecordCompletion completion;
}
