package de.jofoerster.habitsync.model.habit;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Data
public class HabitParticipant {
    @Id
    @GeneratedValue
    private Long id;

    String habitUuid;

    String participantAuthenticationId;

    HabitParticipationStatus habitParticipationStatus;
}
