package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.dto.AccountReadDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitParticipant;
import de.jofoerster.habitsync.model.habit.HabitParticipationStatus;
import de.jofoerster.habitsync.repository.habit.HabitParticipantRepository;
import de.jofoerster.habitsync.service.account.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HabitParticipationService {

    private final HabitParticipantRepository habitParticipantRepository;
    private final AccountService accountService;

    public void inviteParticipant(String habitUuid, String participantAuthId) {
        List<HabitParticipant> participantList =
                habitParticipantRepository
                        .getHabitParticipantByHabitUuidAndParticipantAuthenticationId(habitUuid,
                                participantAuthId);
        if (!participantList.isEmpty()) {
            return; // Participant already invited or part of the habit
        }
        HabitParticipant participant = new HabitParticipant();
        participant.setHabitUuid(habitUuid);
        participant.setParticipantAuthenticationId(participantAuthId);
        participant.setHabitParticipationStatus(HabitParticipationStatus.INVITED);
        habitParticipantRepository.save(participant);
    }

    public void removeParticipant(String habitUuid, String participantAuthId) {
        List<HabitParticipant> participantList =
                habitParticipantRepository
                        .getHabitParticipantByHabitUuidAndParticipantAuthenticationId(habitUuid,
                                participantAuthId);
        if (participantList.isEmpty()) {
            return; // Participant not part of the habit
        }
        habitParticipantRepository.deleteAll(participantList);
    }

    public void acceptInvitation(Habit habit, String participantAuthId) {
        List<HabitParticipant> participantList =
                habitParticipantRepository
                        .getHabitParticipantByHabitUuidAndParticipantAuthenticationId(habit.getUuid(),
                                participantAuthId);
        if (participantList.isEmpty()) {
            return; // No invitation found
        }
        for (HabitParticipant participant : participantList) {
            participant.setHabitParticipationStatus(HabitParticipationStatus.ACCEPTED);
        }
        habitParticipantRepository.saveAll(participantList);
    }

    public void declineInvitation(Habit habit, String participantAuthId) {
        List<HabitParticipant> participantList =
                habitParticipantRepository
                        .getHabitParticipantByHabitUuidAndParticipantAuthenticationId(habit.getUuid(),
                                participantAuthId);
        if (participantList.isEmpty()) {
            return; // No invitation found
        }
        for (HabitParticipant participant : participantList) {
            participant.setHabitParticipationStatus(HabitParticipationStatus.DECLINED);
        }
        habitParticipantRepository.saveAll(participantList);
    }

    public boolean isAccountParticipantOfHabit(String uuid, String authenticationId) {
        return !habitParticipantRepository
                .getHabitParticipantsByHabitParticipationStatusAndParticipantAuthenticationIdAndHabitUuid(
                        HabitParticipationStatus.ACCEPTED, authenticationId, uuid
                ).isEmpty();
    }

    public List<AccountReadDTO> listParticipants(Habit habit) {
        List<HabitParticipant> participantList = habitParticipantRepository
                .getHabitParticipantsByHabitUuidAndHabitParticipationStatusIn(
                        habit.getUuid(),
                        List.of(HabitParticipationStatus.ACCEPTED, HabitParticipationStatus.INVITED));
        return participantList.stream()
                .map(HabitParticipant::getParticipantAuthenticationId)
                .map(accountService::getAccountById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(Account::getApiAccountRead)
                .toList();
    }

    public List<String> getPendingHabitParticipationInvitations(String authenticationId) {
        return habitParticipantRepository.getHabitParticipantsByHabitParticipationStatusAndParticipantAuthenticationId(
                        HabitParticipationStatus.INVITED, authenticationId
                ).stream()
                .map(p -> p.getHabitUuid())
                .toList();
    }

    public List<String> getHabitsByParticipant(Account currentAccount) {
        return habitParticipantRepository
                .getHabitParticipantsByParticipantAuthenticationIdAndHabitParticipationStatus(
                        currentAccount.getAuthenticationId(), HabitParticipationStatus.ACCEPTED
                ).stream().map(HabitParticipant::getHabitUuid).toList();
    }
}
