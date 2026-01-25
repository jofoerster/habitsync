package de.jofoerster.habitsync.model.habit;

import lombok.Getter;

@Getter
public enum HabitStatus {
    UNKNOWN(0),
    ACTIVE(1),
    ARCHIVED(2),
    DELETED(3);

    private final int value;

    HabitStatus(int value) {
        this.value = value;
    }

}
