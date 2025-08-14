package de.jofoerster.habitsync.repository.habit;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabitResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SharedHabitResultsRepository extends JpaRepository<SharedHabitResult, Long> {
    List<SharedHabitResult> getSharedHabitResultsBySharedHabit(SharedHabit sharedHabit);

    List<SharedHabitResult> getSharedHabitResultBySharedHabitAndAccount(SharedHabit sharedHabit, Account account);
}
