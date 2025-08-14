package de.jofoerster.habitsync.model.sharedHabit;

import de.jofoerster.habitsync.model.habit.Habit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@AllArgsConstructor
@Data
@Builder
public class SharedHabitHabitPair {
    private SharedHabit sharedHabit;
    private Habit habit;
}
