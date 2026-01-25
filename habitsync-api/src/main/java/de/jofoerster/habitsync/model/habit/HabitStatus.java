package de.jofoerster.habitsync.model.habit;

public enum HabitStatus {
    ACTIVE(1),
    ARCHIVED(2),
    DELETED(3);

    private final int value;

    HabitStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
