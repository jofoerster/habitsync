package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitParticipant;
import de.jofoerster.habitsync.model.habit.HabitParticipationStatus;
import de.jofoerster.habitsync.repository.habit.HabitParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitParticipationService {

    private final HabitParticipantRepository habitParticipantRepository;

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

    public boolean isAccountParticipantOfHabit(String uuid, String authenticationId) {
        return false;
    }
}
