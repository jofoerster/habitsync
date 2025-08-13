package de.jntn.habit.syncserver.model.sharedHabit;

import de.jntn.habit.syncserver.model.habit.Habit;
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
