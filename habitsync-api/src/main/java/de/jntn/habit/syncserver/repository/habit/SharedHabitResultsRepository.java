package de.jntn.habit.syncserver.repository.habit;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabit;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabitResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SharedHabitResultsRepository extends JpaRepository<SharedHabitResult, Long> {
    List<SharedHabitResult> getSharedHabitResultsBySharedHabit(SharedHabit sharedHabit);

    List<SharedHabitResult> getSharedHabitResultBySharedHabitAndAccount(SharedHabit sharedHabit, Account account);
}
