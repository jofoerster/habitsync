package de.jntn.habit.syncserver.controller;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.challenge.Challenge;
import de.jntn.habit.syncserver.model.challenge.ChallengeStatus;
import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.habit.HabitType;
import de.jntn.habit.syncserver.service.habit.HabitService;
import org.springframework.stereotype.Component;

@Component
public class PermissionChecker {


    //habit
    public static void checkIfisAllowedToRead(Habit habit, Account account, HabitService habitService) {
        checkNotNull(habit);
        if (!habit.getAccount().equals(account) && !habit.isChallengeHabit()) {
            if (habitService.getAllRelatedHabitsToHabitOfUser(habit.getAccount(), habit.getUuid(), HabitType.INTERNAL)
                    .stream()
                    .map(pair ->
                            pair.getHabit().getAccount()).noneMatch(a -> a.equals(account))) {
                throw new IllegalArgumentException("User is not allowed to read this habit");
            }

        }
    }

    public static void checkIfisAllowedToEdit(Habit habit, Account account) {
        checkNotNull(habit);
        if (!habit.getAccount().equals(account)) {
            throw new IllegalArgumentException("User is not allowed to edit this habit");
        }
    }

    public static void checkIfisAllowedToDelete(Habit habit, Account account) {
        checkIfisAllowedToEdit(habit, account);
    }


    //challenge
    public static void checkIfisAllowedToEdit(Challenge challenge, Account account) {
        checkNotNull(challenge);
        if (!challenge.getCreator().equals(account) ||
                challenge.getStatus() != ChallengeStatus.CREATED) {
            throw new IllegalArgumentException("User is not allowed to edit this challenge");
        }
    }

    public static void checkIfisAllowedToDelete(Challenge challenge, Account account) {
        checkNotNull(challenge);
        if (!challenge.getCreator().equals(account) ||
                (challenge.getStatus() != ChallengeStatus.CREATED &&
                        challenge.getStatus() != ChallengeStatus.PROPOSED)) {
            throw new IllegalArgumentException("User is not allowed to delete this challenge");
        }
    }

    private static void checkNotNull(Object object) {
        if (object == null) {
            throw new IllegalArgumentException("Object must not be null");
        }
    }


}
