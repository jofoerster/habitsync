package de.jofoerster.habitsync.model.sharedHabit;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Embeddable
@EqualsAndHashCode
public class SharedHabitResultId implements Serializable {
    private LocalDate date;
    private String accountId;
    private Long sharedHabitId;
}
