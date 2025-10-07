package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.challenge.Challenge;
import de.jofoerster.habitsync.model.challenge.ChallengeStatus;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitType;
import de.jofoerster.habitsync.service.habit.HabitParticipationService;
import de.jofoerster.habitsync.service.habit.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

@Component
@RequiredArgsConstructor
public class PermissionChecker {

    private final HabitParticipationService habitParticipationService;

    //habit
    public void checkIfisAllowedToRead(Habit habit, Account account, HabitService habitService) {
        checkNotNull(habit);
        if (!habit.getAccount().equals(account) && !habit.isChallengeHabit()) {
            if (habitParticipationService.isAccountParticipantOfHabit(habit.getUuid(),
                    account.getAuthenticationId())) {
                return;
            }
            if (habitService.getAllRelatedHabitsToHabitOfUser(habit.getAccount(), habit.getUuid(), HabitType.INTERNAL)
                    .stream()
                    .map(pair ->
                            pair.getHabit().getAccount()).noneMatch(a -> a.equals(account))) {
                throw new IllegalArgumentException("User is not allowed to read this habit");
            }

        }
    }

    public void checkIfisAllowedToEdit(Habit habit, Account account) {
        checkNotNull(habit);
        if (habitParticipationService.isAccountParticipantOfHabit(habit.getUuid(),
                account.getAuthenticationId())) {
            return;
        }
        if (!habit.getAccount().equals(account)) {
            throw new IllegalArgumentException("User is not allowed to edit this habit");
        }
    }

    public void checkIfisAllowedToDelete(Habit habit, Account account) {
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

    public static void checkIfIsOwner (Habit habit, Account account) {
        checkNotNull(habit);
        if (!habit.getAccount().equals(account)) {
            throw new IllegalArgumentException("User is not the owner of this habit");
        }
    }

    private static void checkNotNull(Object object) {
        if (object == null) {
            throw new IllegalArgumentException("Object must not be null");
        }
    }


}
