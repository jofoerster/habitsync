package de.jofoerster.habitsync.dto;

import lombok.Data;

import java.util.List;

@Data
public class HabitSortBody {
    private List<String> habitUuids;
    private Double before;
    private Double after;
}
