package de.jofoerster.habitsync.repository.habit;

import de.jofoerster.habitsync.model.habit.HabitParticipant;
import de.jofoerster.habitsync.model.habit.HabitParticipationStatus;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface HabitParticipantRepository extends JpaRepository<HabitParticipant, Long> {
    List<HabitParticipant> getHabitParticipantByHabitUuid(String habitUuid);

    List<HabitParticipant> getHabitParticipantByHabitUuidAndParticipantAuthenticationId(String habitUuid,
                                                                                        String participantAuthenticationId);

    List<HabitParticipant> getHabitParticipantsByHabitParticipationStatus(
            HabitParticipationStatus habitParticipationStatus);

    List<HabitParticipant> getHabitParticipantsByHabitParticipationStatusAndHabitUuid(
            HabitParticipationStatus habitParticipationStatus, String habitUuid);

    List<HabitParticipant> getHabitParticipantsByHabitParticipationStatusAndParticipantAuthenticationId(
            HabitParticipationStatus habitParticipationStatus, String participantAuthenticationId);

    List<HabitParticipant> getHabitParticipantsByHabitUuid(String habitUuid);

    List<HabitParticipant> getHabitParticipantsByHabitUuidAndHabitParticipationStatusIn(String habitUuid, Collection<HabitParticipationStatus> habitParticipationStatuses);

    List<HabitParticipant> getHabitParticipantsByHabitParticipationStatusAndParticipantAuthenticationIdAndHabitUuid(
            HabitParticipationStatus habitParticipationStatus, String participantAuthenticationId,
            String habitUuid);

    List<HabitParticipant> getHabitParticipantsByParticipantAuthenticationIdAndHabitParticipationStatus(String authenticationId, HabitParticipationStatus habitParticipationStatus);
}
