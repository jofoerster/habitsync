package de.jntn.habit.syncserver.service.notification;

import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabit;
import de.jntn.habit.syncserver.model.notification.NotificationRule;
import de.jntn.habit.syncserver.model.notification.NotificationTemplate;
import de.jntn.habit.syncserver.model.notification.NotificationType;
import de.jntn.habit.syncserver.repository.notification.NotificationRuleRepository;
import de.jntn.habit.syncserver.service.habit.HabitService;
import de.jntn.habit.syncserver.service.habit.SharedHabitService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationRuleService {
    private final NotificationRuleRepository notificationRuleRepository;
    private final NotificationTemplateService notificationTemplateService;
    private final HabitService habitService;

    public NotificationRuleService(NotificationRuleRepository notificationRuleRepository,
                                   NotificationTemplateService notificationTemplateService, HabitService habitService) {
        this.notificationRuleRepository = notificationRuleRepository;
        this.notificationTemplateService = notificationTemplateService;
        this.habitService = habitService;
    }

    public List<NotificationRule> getNotificationRulesBySharedHabit(SharedHabit sharedHabit) {
        return notificationRuleRepository.getNotificationRuleBySharedHabit(sharedHabit);
    }

    public NotificationRule saveNotificationRule(NotificationRule rule) {
        return notificationRuleRepository.save(rule);
    }

    public NotificationRule saveNotificationRule(NotificationRuleCreationDTO r, SharedHabit sharedHabit) {
        NotificationRule notificationRule = createNotificationRuleAsNew(r);
        notificationRule.setSharedHabit(sharedHabit);
        if (r.getId() != null) {
            notificationRule.setId(r.getId());
        }
        return saveNotificationRule(notificationRule);
    }

    public NotificationRule saveNotificationRule(NotificationRuleCreationDTO r, SharedHabitService sharedHabitService) {
        NotificationRule notificationRule = createNotificationRuleAsNew(r);
        if (r.getId() != null) {
            notificationRule.setId(r.getId());
        }
        if (r.getSharedHabitShareCode() != null) {
            Optional<SharedHabit> sharedHabitOpt = sharedHabitService.getSharedHabitByCode(r.getSharedHabitShareCode());
            sharedHabitOpt.ifPresent(notificationRule::setSharedHabit);
        }
        return saveNotificationRule(notificationRule);
    }

    public NotificationRule createNotificationRuleAsNew(NotificationRuleCreationDTO r) {
        String freqCustom = "";
        if (r.getFreqType() == 1 || r.getFreqType() == 2) {
            freqCustom = "[" + r.getFreqCustomSingle() + "]";
        } else if (r.getFreqType() == 3) {
            freqCustom = "[" + r.getFreqCustomTimes() + "," + r.getFreqCustomDays() + "]";
        }

        Habit internalHabit = new Habit();
        internalHabit.setDailyGoal(r.getDailyScore());
        internalHabit.setDailyGoalUnit(r.getDailyScoreUnit());
        internalHabit.setDailyGoalExtra(r.getDailyReachableValue());
        internalHabit.setFreqCustom(freqCustom);
        internalHabit.setFreqType(r.getFreqType());
        internalHabit.setTargetDays(r.getTargetDays());
        habitService.saveHabit(internalHabit);

        NotificationTemplate notificationTemplate =
                notificationTemplateService.getNotificationTemplateByNotificationType(
                        NotificationType.valueOf(r.getNotificationType()));

        NotificationRule notificationRule = new NotificationRule();
        notificationRule.setDaysOfNoNewRecordForNotificationTrigger(r.getNumberOfDays());
        notificationRule.setPercentageOfGoalForNotificationTrigger(r.getPercentageNeeded());
        notificationRule.setInternalHabitForComputationOfGoal(internalHabit);
        notificationRule.setNotificationTemplate(notificationTemplate);
        if (r.getIndex() != null) {
            notificationRule.setIndex(r.getIndex());
        }
        return notificationRule;
    }

    public NotificationRuleCreationDTO getDTO(NotificationRule rule) {
        NotificationRuleCreationDTO dto = new NotificationRuleCreationDTO();

        dto.setNumberOfDays(rule.getDaysOfNoNewRecordForNotificationTrigger());
        dto.setPercentageNeeded(rule.getPercentageOfGoalForNotificationTrigger());
        dto.setIndex(rule.getIndex());
        dto.setId(rule.getId());

        if (rule.getNotificationTemplate() != null) {
            dto.setNotificationType(rule.getNotificationTemplate()
                    .getNotificationType()
                    .name());
            dto.setNotificationTypeLabel(rule.getNotificationTemplate()
                    .getNotificationType().label);
        }

        Habit internalHabit = rule.getInternalHabitForComputationOfGoal();
        if (internalHabit != null) {
            if (internalHabit.getDailyGoal() != null) {
                dto.setDailyScore(internalHabit.getDailyGoal());
            }
            dto.setDailyReachableValue(internalHabit.getReachableDailyValue());
            dto.setDailyScoreUnit(internalHabit.getDailyGoalUnit());
            dto.setTargetDays(internalHabit.getTargetDays());
            String freqCustom = internalHabit.getFreqCustom();
            if (freqCustom != null && !freqCustom.isEmpty()) {
                freqCustom = freqCustom.replace("[", "")
                        .replace("]", "");

                String[] parts = freqCustom.split(",");

                if (parts.length == 1) {
                    int freqCustomSingle = Integer.parseInt(parts[0]);
                    dto.setFreqCustomSingle(freqCustomSingle);

                } else if (parts.length == 2) {
                    dto.setFreqCustomTimes(Integer.parseInt(parts[0]));
                    dto.setFreqCustomDays(Integer.parseInt(parts[1]));
                }
                dto.setFreqType(internalHabit.getFreqType());
            }
        }
        return dto;
    }

    public Optional<NotificationRule> getNotificationRuleById(Long ruleId) {
        if (ruleId == null) {
            return Optional.empty();
        }
        return notificationRuleRepository.findById(ruleId);
    }

    public void deleteNotificationRule(Long ruleId) {
        notificationRuleRepository.deleteById(ruleId);
    }

    public void save(List<NotificationRule> notificationRules) {
        notificationRuleRepository.saveAll(notificationRules);
    }

    public NotificationRule getTemporaryMainNotificationRuleForSharedHabit(SharedHabit sharedHabit,
                                                                           NotificationTemplate notificationTemplate) {
        NotificationRule notificationRule = new NotificationRule();
        notificationRule.setEnabled(false);
        notificationRule.setInternalHabitForComputationOfGoal(sharedHabit.getHabits()
                .stream()
                .filter(h -> h.getAccount().equals(sharedHabit.getOwner()))
                .findFirst().orElse(sharedHabit.getHabits().iterator().next()));
        notificationRule.setNotificationTemplate(notificationTemplate);
        return notificationRule;
    }
}
