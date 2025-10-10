package de.jofoerster.habitsync.model.notification;

import com.fasterxml.jackson.annotation.JsonBackReference;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;

@EqualsAndHashCode(exclude = {"sharedHabit", "notificationTemplate"})
@ToString(exclude = {"sharedHabit", "notificationTemplate"})
@Data
@Entity
public class NotificationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer index;
    private String ruleName;
    @ManyToOne
    private NotificationTemplate notificationTemplate;
    @ManyToOne
    @JsonBackReference
    private SharedHabit sharedHabit;

    // check if this should trigger at all (for pinging other users)
    private boolean enabled = true;

    //Configuration of values for triggering of notifications. See NotificationTimeEnum
    @ManyToOne
    private Habit internalHabitForComputationOfGoal;
    private Integer percentageOfGoalForNotificationTrigger;
    private Integer daysOfNoNewRecordForNotificationTrigger;
    private LocalDate lastTimeNotificationWasSent;

    public Double getMaxValue(Habit habit, HabitRecordSupplier recordSupplier, LocalDate startDate, LocalDate endDate) {
        if (internalHabitForComputationOfGoal == null) {
            return habit.getMaxValue(recordSupplier, habit, startDate, endDate);
        } else {
            return internalHabitForComputationOfGoal.getMaxValue(recordSupplier, habit, startDate, endDate);
        }
    }
}
