package de.jntn.habit.syncserver.model.sharedHabit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.notification.NotificationRule;
import de.jntn.habit.syncserver.model.notification.NotificationTemplate;
import de.jntn.habit.syncserver.repository.habit.HabitRecordSupplier;
import de.jntn.habit.syncserver.service.notification.NotificationRuleService;
import de.jntn.habit.syncserver.util.HashGenerator;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.*;
import java.util.stream.Collectors;

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

    public Map<NotificationRule, Map<Account, Map<Boolean, Habit>>> getStatusOfAllHabits(
            NotificationRuleService notificationRuleService, HabitRecordSupplier recordSupplier) {
        Map<NotificationRule, Map<Account, Map<Boolean, Habit>>> result = new HashMap<>();
        Set<Account> allAccounts = habits.stream()
                .map(Habit::getAccount)
                .collect(Collectors.toSet());
        return notificationRuleService.getNotificationRulesBySharedHabit(this)
                .stream()
                .collect(Collectors.toMap(r -> r, r -> allAccounts.stream()
                        .collect(Collectors.toMap(a -> a,
                                a -> r.computeWhichHabitsTriggerNotificationForAccount(habits, a, recordSupplier)))));
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

    public NotificationRule getTemporaryMainNotificationRule(NotificationRuleService notificationRuleService,
                                                             NotificationTemplate notificationTemplate) {
        return getMainNotificationRule(notificationRuleService).orElseGet(
                () -> notificationRuleService.getTemporaryMainNotificationRuleForSharedHabit(this,
                        notificationTemplate));
    }

    public double getProgressOfHabit(Habit habit, NotificationRuleService notificationRuleService,
                                     HabitRecordSupplier habitRecordSupplier) {
        Optional<NotificationRule> rule = getMainNotificationRule(notificationRuleService);
        return rule.map(notificationRule -> notificationRule.getPercentage(habit, habitRecordSupplier))
                .orElseGet(() -> habit.getCompletionPercentage(habitRecordSupplier));
    }

    public boolean getCompletionForDay(Habit habit, NotificationRuleService notificationRuleService,
                                       HabitRecordSupplier habitRecordSupplier, Integer day) {
        Optional<NotificationRule> rule = getMainNotificationRule(notificationRuleService);
        return rule.map(notificationRule -> notificationRule.getCompletionForDay(habit, habitRecordSupplier, day))
                .orElseGet(() -> habit.getCompletionForDay(habitRecordSupplier, day));
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