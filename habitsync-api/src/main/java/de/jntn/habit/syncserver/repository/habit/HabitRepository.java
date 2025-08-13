package de.jntn.habit.syncserver.repository.habit;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.habit.HabitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByAccount(Account account);

    Optional<Habit> findByUuid(String uuid);

    List<Habit> findHabitsByAccountAndChallengeHabitIsTrue(Account account);

    List<Habit> findByAccountAndChallengeHabit(Account account, boolean challengeHabit);

    List<Habit> findHabitsByChallengeHabitIsTrue();

    List<Habit> findByAccountAndChallengeHabitAndStatus(Account account, boolean challengeHabit, Integer status);

    List<Habit> findHabitsByAccountAndChallengeHabit(Account account, boolean challengeHabit);

    List<Habit> findByAccountAndHabitType(Account account, HabitType habitType);

    List<Habit> findByAccountAndHabitTypeAndStatus(Account account, HabitType habitType, Integer status);

    List<Habit> findByAccountAndHabitTypeAndStatusOrderBySortPosition(Account account, HabitType habitType,
                                                                      Integer status);
}
