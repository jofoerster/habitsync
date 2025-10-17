package de.jofoerster.habitsync.service.imports.loophabit;

import lombok.Data;

import java.time.LocalDate;

@Data
public class LoopHabitCheckmarksImportDTO {

    private LocalDate date;

    private Double value;
}

