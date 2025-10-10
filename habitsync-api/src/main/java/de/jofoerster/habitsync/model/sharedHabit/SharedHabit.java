package de.jofoerster.habitsync.model.sharedHabit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.notification.NotificationRule;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.service.habit.CachingHabitProgressService;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
import de.jofoerster.habitsync.util.HashGenerator;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.util.*;

@EqualsAndHashCode(exclude = {"habits", "owner"})
@ToString(exclude = {"habits", "owner"})
@Data
@Entity
@Table(name = "shared_habits")
public class SharedHabit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String shareCode;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;
    private Long createTime;

    private Long mainNotificationRuleId;

    private Boolean allowEditingOfAllUsers = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "shared_habit_mappings", joinColumns = @JoinColumn(name = "shared_habit_id"),
            inverseJoinColumns = @JoinColumn(name = "habit_id"))
    private List<Habit> habits = new ArrayList<>();

    public Set<Habit> getHabits() {
        return new HashSet<>(habits);
    }

    @JsonIgnore
    @ManyToOne
    private Account owner;

    public SharedHabit() {
        this.createTime = System.currentTimeMillis() / 1000;
        this.shareCode = HashGenerator.generateRandomString(10);
    }

    public void addHabit(Habit habit) {
        habits.add(habit);
    }

    public Optional<NotificationRule> getMainNotificationRule(NotificationRuleService notificationRuleService) {
        List<NotificationRule> rules = notificationRuleService.getNotificationRulesBySharedHabit(this);
        if (rules.isEmpty()) {
            return Optional.empty();
        }
        Optional<NotificationRule> mainRule = notificationRuleService.getNotificationRuleById(mainNotificationRuleId);
        if (mainRule.isPresent()) {
            return mainRule;
        } else {
            mainNotificationRuleId = rules.get(0)
                    .getId();
            return Optional.of(rules.get(0));
        }
    }

    public double getProgressOfHabit(Habit habit, NotificationRuleService notificationRuleService,
                                     CachingHabitProgressService cachingHabitProgressService) {
        Optional<NotificationRule> rule = getMainNotificationRule(notificationRuleService);
        return rule.map(notificationRule -> cachingHabitProgressService.getCompletionPercentageAtDate(
                        notificationRule.getInternalHabitForComputationOfGoal(), habit,
                        LocalDate.now()))
                .orElseGet(() -> cachingHabitProgressService.getCompletionPercentageAtDate(habit,
                        LocalDate.now()));
    }

    public boolean getCompletionForDay(Habit habit, NotificationRuleService notificationRuleService,
                                       CachingHabitProgressService cachingHabitProgressService, Integer day) {
        Optional<NotificationRule> rule = getMainNotificationRule(notificationRuleService);
        return rule.map(notificationRule -> cachingHabitProgressService.getCompletionForDay(
                LocalDate.ofEpochDay(day), notificationRule.getInternalHabitForComputationOfGoal(), habit))
                .orElseGet(() -> cachingHabitProgressService.getCompletionForDay(
                        LocalDate.ofEpochDay(day), habit));
    }

    public void removeHabit(Habit habit) {
        habits.remove(habit);
    }

    public void addNewNotificationRule(NotificationRule notificationRule) {
        if (mainNotificationRuleId == null) {
            mainNotificationRuleId = notificationRule.getId();
        }
    }

    public void removeNotificationRule(NotificationRule notificationRule) {
        if (notificationRule.getId()
                .equals(mainNotificationRuleId)) {
            mainNotificationRuleId = null;
        }
    }

    public Optional<Habit> getHabitByOwner(Account owner) {
        return this.getHabits()
                .stream()
                .filter(h -> h.getAccount()
                        .equals(owner))
                .findFirst();
    }

}