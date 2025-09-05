package de.jofoerster.habitsync.repository.habit;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT h FROM Habit h WHERE h.reminderCustom IS NOT NULL AND h.reminderCustom != '' AND h.status = :status")
    List<Habit> findByReminderCustomIsNotEmptyAndStatus(@Param("status") Integer status);
}
