package de.jntn.habit.syncserver.model.sharedHabit;

import de.jntn.habit.syncserver.model.account.Account;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class SharedHabitResult {
    @EmbeddedId
    private SharedHabitResultId id;

    @ManyToOne
    @MapsId("accountId")  // Maps to the accountId field in the composite key
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne
    @MapsId("sharedHabitId")
    @JoinColumn(name = "shared_habit_id")
    private SharedHabit sharedHabit;

    private Double percentage;
    private Integer placement;

    // Convenience constructor
    public SharedHabitResult(LocalDate date, Account account, SharedHabit sharedHabit, Double percentage,
                             Integer placement) {
        this.id = new SharedHabitResultId(date, account.getAuthenticationId(), sharedHabit.getId());
        this.sharedHabit = sharedHabit;
        this.account = account;
        this.percentage = percentage;
        this.placement = placement;
    }

    // Convenience getters for ID components
    public LocalDate getDate() {
        return id.getDate();
    }

    public Long getSharedHabitId() {
        return id.getSharedHabitId();
    }
}
