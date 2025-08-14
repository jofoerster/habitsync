package de.jofoerster.habitsync.model.challenge;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.dto.ChallengeWriteDTO;
import de.jofoerster.habitsync.dto.ComputationReadWriteDTO;
import de.jofoerster.habitsync.model.notification.NotificationRule;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static de.jofoerster.habitsync.util.Utils.ifNotNull;

@Data
@Entity
public class Challenge {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Account creator;

    private ChallengeStatus status = ChallengeStatus.CREATED;
    @ManyToOne
    private NotificationRule rule;
    private LocalDate startDate;
    private LocalDate endDate;

    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;

    private ChallengeComputationType computationType;

    public Map<Account, ChallengeProgress> getProgressOfHabits(List<Habit> habits, HabitRecordSupplier recordSupplier) {
        Map<Account, ChallengeProgress> progressAbsolute = new HashMap<>();

        if (computationType.equals(ChallengeComputationType.MAX_VALUE)) {
            habits.forEach(habit -> {
                Double progress = rule.getMaxValue(habit, recordSupplier, startDate, endDate);
                if (progress == null) {
                    progress = 0d;
                }
                progressAbsolute.put(habit.getAccount(), ChallengeProgress.builder()
                        .maxValue(progress)
                        .percentage(progress)
                        .total(rule.getTotalAchievement(habit, recordSupplier, startDate, endDate))
                        .challengeUnit(rule.getInternalHabitForComputationOfGoal().getDailyGoalUnit())
                        .linkToHabit(linkToHabit(habit))
                        .build());
            });
        } else {
            habits.forEach(habit -> progressAbsolute.put(habit.getAccount(), ChallengeProgress.builder()
                    .percentage(rule.getPercentage(habit, recordSupplier, startDate, endDate))
                    .total(rule.getTotalAchievement(habit, recordSupplier, startDate, endDate))
                    .challengeUnit(rule.getInternalHabitForComputationOfGoal().getDailyGoalUnit())
                    .linkToHabit(linkToHabit(habit))
                    .build()));
        }
        if (ChallengeComputationType.ABSOLUTE.equals(computationType)) {
            return progressAbsolute;
        } else if (ChallengeComputationType.RELATIVE.equals(computationType) ||
                ChallengeComputationType.MAX_VALUE.equals(computationType)) {
            Double maxProgress = progressAbsolute.values()
                    .stream()
                    .map(ChallengeProgress::getPercentage)
                    .max(Double::compareTo)
                    .orElse(0d);
            if (maxProgress == 0) {
                return progressAbsolute;
            }
            Map<Account, ChallengeProgress> progressRelative = new HashMap<>();
            progressAbsolute.keySet()
                    .forEach(account -> progressRelative.put(account, ChallengeProgress.builder()
                            .percentage((progressAbsolute.get(account)
                                    .getPercentage() / maxProgress) * 100)
                            .maxValue(progressAbsolute.get(account)
                                    .getMaxValue())
                            .linkToHabit(progressAbsolute.get(account)
                                    .getLinkToHabit())
                                    .total(progressAbsolute.get(account).getTotal())
                                    .challengeUnit(progressAbsolute.get(account).getChallengeUnit())
                            .build()));
            return progressRelative;
        } else {
            throw new IllegalStateException("No implementation for computationType " + computationType);
        }
    }

    private String linkToHabit(Habit habit) {
        return "/habit/" + habit.getUuid();
    }

    public ComputationReadWriteDTO getApiComputationReadWrite() {
        if (this.getComputationType() == null) {
            throw new IllegalStateException("Computation type must be set before converting to API model");
        }
        if (this.getRule() == null) {
            throw new IllegalStateException("Notification rule must be set before converting to API model");
        }
        if (this.getRule().getInternalHabitForComputationOfGoal() == null) {
            throw new IllegalStateException("Internal habit for computation of goal must be set before converting to API model");
        }
        ComputationReadWriteDTO computation = this.getRule().getInternalHabitForComputationOfGoal()
                .getApiComputationReadWrite();
        computation.setChallengeComputationType(this.getComputationType());
        return computation;
    }

    public void applyChanges(ChallengeWriteDTO challengeDTO) {
        NotificationRule notificationRule;
        Habit habit;
        if (this.getRule() != null) {
            notificationRule = this.getRule();
        } else {
            notificationRule = new NotificationRule();
            this.setRule(notificationRule);
        }
        if (notificationRule.getInternalHabitForComputationOfGoal() != null) {
            habit = notificationRule.getInternalHabitForComputationOfGoal();
        } else {
            habit = new Habit();
            notificationRule.setInternalHabitForComputationOfGoal(habit);
        }
        this.setRule(notificationRule);

        habit.applyChanges(challengeDTO.getComputation());

        this.setTitle(challengeDTO.getTitle());
        this.setDescription(challengeDTO.getDescription());
        this.setComputationType(challengeDTO.getComputation().getChallengeComputationType());
    }
}
