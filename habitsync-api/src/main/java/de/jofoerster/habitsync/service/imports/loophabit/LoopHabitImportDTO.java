package de.jofoerster.habitsync.service.imports.loophabit;

import lombok.Data;

@Data
public class LoopHabitImportDTO {

    private String position;
    private String name;
    private String question;
    private String description;
    private Integer numRepetitions;
    private Integer interval;
    private String color;
}

