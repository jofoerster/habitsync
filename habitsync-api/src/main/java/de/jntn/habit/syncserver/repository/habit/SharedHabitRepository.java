package de.jntn.habit.syncserver.repository.habit;

import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedHabitRepository extends JpaRepository<SharedHabit, Long> {
    Optional<SharedHabit> findByShareCode(String shareCode);

    List<SharedHabit> findAllByHabitsContaining(List<Habit> habits);

    List<SharedHabit> findAllByHabitsIsNotEmpty();
}
