package de.jofoerster.habitsync.model.notification;

import com.fasterxml.jackson.annotation.JsonBackReference;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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


    public Map<Boolean, Habit> computeWhichHabitsTriggerNotificationForAccount(List<Habit> habits, Account account,
                                                                               HabitRecordSupplier recordSupplier) {
        if (!enabled) {
            return new HashMap<>();
        }
        Map<Boolean, Habit> result = new HashMap<>();
        habits.forEach(habit -> {
            if (checkIfHabitTriggersNotificationForAccount(habit, account, recordSupplier)) {
                result.put(true, habit);
            } else {
                result.put(false, habit);
            }
        });
        return result;
    }

    private boolean checkIfHabitTriggersNotificationForAccount(Habit habit, Account accountToCheck,
                                                               HabitRecordSupplier habitRecordSupplier) {
        NotificationType notificationType = notificationTemplate.getNotificationType();
        if (notificationType == NotificationType.PERCENTAGE_REACHED_BY_ANYONE) {
            return getPercentage(habit, habitRecordSupplier) >= percentageOfGoalForNotificationTrigger;
        } else if (notificationType == NotificationType.PERCENTAGE_REACHED_BY_SOMEONE_ELSE) {
            return getPercentage(habit, habitRecordSupplier) >= percentageOfGoalForNotificationTrigger &&
                    habit.getAccount() != accountToCheck;
        } else if (notificationType == NotificationType.NO_OWN_RECORD_FOR_CERTAIN_TIME) {
            return habit.getAccount()
                    .equals(accountToCheck) &&
                    habitRecordSupplier.getTimeSinceLastRecordByHabit(habit) > daysOfNoNewRecordForNotificationTrigger;
        } else if (notificationType == NotificationType.NEW_RECORD_OF_OTHER_USER) {
            return !habit.getAccount()
                    .equals(accountToCheck) && habitRecordSupplier.getTimeSinceLastRecordByHabit(habit) <=
                    Period.between(lastTimeNotificationWasSent, LocalDate.now())
                            .getDays();
        } else {
            // Why am I here :(
            return false;
        }
    }

    public double getPercentage(Habit habit, HabitRecordSupplier recordSupplier) {
        if (internalHabitForComputationOfGoal == null) {
            return habit.getCompletionPercentage(recordSupplier);
        } else {
            return internalHabitForComputationOfGoal.getCompletionPercentage(recordSupplier, habit);
        }
    }

    public double getPercentage(Habit habit, HabitRecordSupplier recordSupplier, LocalDate startDate,
                                LocalDate endDate) {
        if (internalHabitForComputationOfGoal == null) {
            return habit.getCompletionPercentage(recordSupplier, habit, startDate, endDate);
        } else {
            return internalHabitForComputationOfGoal.getCompletionPercentage(recordSupplier, habit, startDate, endDate);
        }
    }

    public double getTotalAchievement(Habit habit, HabitRecordSupplier recordSupplier) {
        return getTotalAchievement(habit, recordSupplier, null, null);
    }
    public double getTotalAchievement(Habit habit, HabitRecordSupplier recordSupplier, LocalDate forcedStartDate,
                                      LocalDate forcedEndDate) {
        if (internalHabitForComputationOfGoal == null) {
            return habit.getTotalAchievement(recordSupplier, habit, forcedStartDate, forcedEndDate);
        } else {
            return internalHabitForComputationOfGoal.getTotalAchievement(recordSupplier, habit, forcedStartDate, forcedEndDate);
        }
    }

    public Double getMaxValue(Habit habit, HabitRecordSupplier recordSupplier, LocalDate startDate, LocalDate endDate) {
        if (internalHabitForComputationOfGoal == null) {
            return habit.getMaxValue(recordSupplier, habit, startDate, endDate);
        } else {
            return internalHabitForComputationOfGoal.getMaxValue(recordSupplier, habit, startDate, endDate);
        }
    }

    public boolean getCompletionForDay(Habit habit, HabitRecordSupplier habitRecordSupplier, int day) {
        if (internalHabitForComputationOfGoal == null) {
            return habit.getCompletionForDay(habitRecordSupplier, day);
        } else {
            return internalHabitForComputationOfGoal.getCompletionForDay(habitRecordSupplier, day, habit);
        }
    }
}
