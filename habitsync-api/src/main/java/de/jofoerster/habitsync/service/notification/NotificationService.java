package de.jofoerster.habitsync.service.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.jofoerster.habitsync.dto.NotificationConfigDTO;
import de.jofoerster.habitsync.dto.NotificationConfigRuleDTO;
import de.jofoerster.habitsync.dto.NotificationTypeEnum;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.notification.*;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.repository.notification.NotificationRuleStatusRepository;
import de.jofoerster.habitsync.service.habit.CachingHabitProgressService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.habit.SharedHabitService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.TemplateEngine;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final HabitService habitService;
    private final SchedulingService schedulingService;
    private final NotificationTemplateService notificationTemplateService;
    private final TemplateEngine templateEngine;
    private final NotificationRuleService notificationRuleService;
    private final HabitRecordRepository habitRecordRepository;
    private final Optional<EmailService> emailService;
    private final ResourceLoader resourceLoader;
    private final RestTemplate restTemplate = new RestTemplate();
    private final NotificationRuleStatusRepository notificationRuleStatusRepository;
    private final SharedHabitService sharedHabitService;
    private final CachingHabitProgressService cachingHabitProgressService;

    ObjectMapper mapper = new ObjectMapper();

    @Value("${base.url}")
    String baseUrl;

    @Value("${apprise.api.url:}")
    String appriseApiUrl;

    private final List<Habit> habitsWithCustomReminders = new ArrayList<>();
    private final Set<String> habitsWithoutUpdates = new HashSet<>();
    private final Set<String> habitsWithoutUpdatesTemp = new HashSet<>();
    private Map<String, Boolean> habitRuleNotificationStatusMap = new HashMap<String, Boolean>();

    @PostConstruct
    public void init() {
        log.info("Scheduling user notification jobs");
        List<Habit> habitsWithReminders = habitService.getHabitsWithReminders();
        habitsWithReminders.forEach(this::scheduleAllNotificationJobsForHabit);
        habitsWithCustomReminders.addAll(habitsWithReminders);
        habitRuleNotificationStatusMap = notificationRuleStatusRepository.findAll().stream()
                .collect(Collectors.toMap(NotificationRuleStatus::getRuleIdentifier,
                        NotificationRuleStatus::isActive));
    }

    @Scheduled(cron = "0 */10 * * * *") // Do not change -> see isFirstCheckToday
    public void checkNotificationRules() {
        log.info("Checking notification rules for all habits with reminders");
        habitsWithoutUpdatesTemp.addAll(habitsWithoutUpdates);
        habitsWithCustomReminders.forEach(habit -> {
            habitsWithoutUpdates.add(habit.getUuid());
            List<NotificationConfigRuleDTO> rules = habitService.getNotificationConfig(habit).getRules();
            rules.forEach(rule -> {
                this.checkAndExecuteRule(habit, rule);
            });
        });
        habitsWithoutUpdatesTemp.clear();
    }

    public void markHabitAsUpdated(Habit habit) {
        habitsWithoutUpdates.remove(habit.getUuid());
    }

    private void checkAndExecuteRule(Habit habit, NotificationConfigRuleDTO rule) {
        switch (rule.getType()) {
            case NotificationTypeEnum.fixed -> {
                return; // Fixed time notifications are handled by scheduled jobs
            }
            case NotificationTypeEnum.threshold -> {
                if (!rule.isEnabled() || rule.getThresholdPercentage() == null ||
                        (habitsWithoutUpdatesTemp.contains(habit.getUuid()) && !isFirstCheckToday())) {
                    return;
                }
                String ruleIdentifier = getIdentifierFromRule(rule, habit);
                boolean wasActive = habitRuleNotificationStatusMap.getOrDefault(ruleIdentifier, false);
                boolean isActive =
                        cachingHabitProgressService.getCompletionPercentageAtDate(habit, LocalDate.now())
                                < rule.getThresholdPercentage();
                if (!wasActive && isActive) {
                    log.debug("Threshold rule triggered for habit {}", habit.getUuid());
                    sendCustomReminderNotifications(rule, habit);
                    this.updateState(ruleIdentifier, true);
                    return;
                }
                if (wasActive && !isActive) {
                    log.debug("Threshold rule deactivated for habit {}", habit.getUuid());
                    this.updateState(ruleIdentifier, false);
                }
                return;
            }
            case NotificationTypeEnum.overtake -> {
                if (!rule.isEnabled()) {
                    return;
                }
                sharedHabitService.getSharedHabitsByHabit(habit).forEach(sh -> {
                    sh.getHabits().forEach(ch -> {
                        habitsWithoutUpdates.add(ch.getUuid());
                        boolean overtaken = checkAndExecuteOvertakeRule(habit, ch, rule);
                        if (overtaken) {
                            return;
                        }
                    });
                });
            }
        }
    }

    private boolean checkAndExecuteOvertakeRule(Habit habit, Habit ch, NotificationConfigRuleDTO rule) {
        if (habitsWithoutUpdatesTemp.contains(habit.getUuid()) && habitsWithoutUpdatesTemp.contains(ch.getUuid()) &&
                !isFirstCheckToday()) {
            return false;
        }
        String ruleIdentifier = getIdentifierFromRule(rule, habit, ch);
        boolean wasActive = habitRuleNotificationStatusMap.getOrDefault(ruleIdentifier, false);
        boolean isActive =
                cachingHabitProgressService.getCompletionPercentageAtDate(habit, LocalDate.now())
                        < cachingHabitProgressService.getCompletionPercentageAtDate(ch, LocalDate.now());
        if (!wasActive && isActive) {
            log.debug("Overtake rule triggered for habit {}", habit.getUuid());
            sendCustomReminderNotifications(rule, habit);
            this.updateState(ruleIdentifier, true);
            return true;
        }
        if (wasActive && !isActive) {
            log.debug("Overtake rule deactivated for habit {}", habit.getUuid());
            this.updateState(ruleIdentifier, false);
        }
        return false;
    }

    private void updateState(String ruleIdentifier, boolean newState) {
        habitRuleNotificationStatusMap.put(ruleIdentifier, newState);
        notificationRuleStatusRepository.save(NotificationRuleStatus.builder()
                .ruleIdentifier(ruleIdentifier)
                .isActive(newState)
                .build());
    }

    private void scheduleAllNotificationJobsForHabit(Habit habit) {
        List<NotificationConfigRuleDTO> fixedTimeRules = habitService.getFixedTimeNotificationRules(habit);
        fixedTimeRules.forEach(rule ->
                schedulingService.scheduleNotificationJob(habit.getUuid(), rule));
    }

    public boolean createOrUpdateNotificationsForHabit(Habit habit, NotificationConfigDTO frequency) {
        try {
            habit.setReminderCustom(mapper.writeValueAsString(frequency));
            habit = habitService.saveHabit(habit);
            if (!habitsWithCustomReminders.contains(habit)) {
                habitsWithCustomReminders.add(habit);
            }
            for (NotificationConfigRuleDTO r : frequency.getRules()) {
                this.initializeNewRule(habit, r);
            }
            scheduleAllNotificationJobsForHabit(habit);
            return true;
        } catch (JsonProcessingException e) {
            log.warn("Could not set reminderCustom for habit {}", habit.getUuid(), e);
            return false;
        }
    }

    private void initializeNewRule(Habit habit, NotificationConfigRuleDTO rule) {
        switch (rule.getType()) {
            case NotificationTypeEnum.fixed -> {
                return;
            }
            case NotificationTypeEnum.overtake -> {
                sharedHabitService.getSharedHabitsByHabit(habit).forEach(sh -> {
                    sh.getHabits().forEach(ch -> {
                        updateState(getIdentifierFromRule(rule, habit, ch), true);
                    });
                });
            }
            case NotificationTypeEnum.threshold -> {
                updateState(getIdentifierFromRule(rule, habit), true);
            }
        }
    }

    public boolean deleteNotificationForHabit(Habit habit) {
        habit.setReminderCustom(null);
        habitService.saveHabit(habit);
        schedulingService.removeNotificationJob(habit.getUuid());
        return true;
    }

    public void sendCustomReminderNotifications(NotificationConfigRuleDTO rule, Habit habit) {
        log.info("Sending custom reminder notifications");
        NotificationType type = switch (rule.getType()) {
            case NotificationTypeEnum.threshold -> NotificationType.THRESHOLD_PUSH_NOTIFICATION_HABIT;
            case NotificationTypeEnum.overtake -> NotificationType.OVERTAKE_PUSH_NOTIFICATION_HABIT;
            default -> null;
        };
        if (type == null) {
            log.warn("Could not determine notification type for rule {}", rule);
            return;
        }
        NotificationTemplate notificationTemplate =
                notificationTemplateService.getNotificationTemplateByNotificationType(
                        type);
        Notification notification =
                notificationTemplate.createNotification(habit.getAccount(), Optional.empty(), null, habit, null,
                        templateEngine,
                        notificationRuleService, new HabitRecordSupplier(habitRecordRepository), baseUrl,
                        NotificationStatus.STATELESS_NOTIFICATION, resourceLoader, rule, cachingHabitProgressService);
        sendNotificationViaApprise(notification, habit);
        if (habit.getAccount().isSendNotificationsViaEmail()) {
            sendNotificationViaMail(notification);
        }
    }

    public void sendFixedTimePushNotifications(String id) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(id);
        if (habitOpt.isEmpty()) {
            log.warn("Could not find habit with id {}", id);
            return;
        }
        List<NotificationConfigRuleDTO> fixedTimeRules = habitService.getFixedTimeNotificationRules(habitOpt.get());
        if (fixedTimeRules == null || fixedTimeRules.isEmpty()) {
            log.warn("Could not find notification config for habit with id {}", id);
            return;
        }
        if (fixedTimeRules.getFirst().getTriggerOnlyWhenStreakLost()) {
            if (cachingHabitProgressService.getCompletionForDay(LocalDate.now(), habitOpt.get())) {
                log.debug("Habit {} has not lost its streak today. Not sending fixed time notification.",
                        habitOpt.get().getUuid());
                return;
            }
        } if (!fixedTimeRules.getFirst().getTriggerIfFulfilled()) {
            if (habitService.hasHabitBeenCompletedToday(habitOpt.get(),
                    new HabitRecordSupplier(habitRecordRepository))) {
                log.debug("Habit {} has already been completed today. Not sending fixed time notification.",
                        habitOpt.get().getUuid());
                return;
            }
        }

        NotificationTemplate notificationTemplate =
                notificationTemplateService.getNotificationTemplateByNotificationType(
                        NotificationType.FIXED_TIME_PUSH_NOTIFICATION_HABIT);
        Habit habit = habitOpt.get();
        Notification notification =
                notificationTemplate.createNotification(habit.getAccount(), Optional.empty(), null, habit, null,
                        templateEngine,
                        notificationRuleService, new HabitRecordSupplier(habitRecordRepository), baseUrl,
                        NotificationStatus.STATELESS_NOTIFICATION, resourceLoader, null, cachingHabitProgressService);
        sendNotificationViaApprise(notification, habit);
        if (habit.getAccount().isSendNotificationsViaEmail()) {
            sendNotificationViaMail(notification);
        }
    }

    public void sendNotificationViaMail(Notification notification) {
        if (emailService.isEmpty()) {
            log.warn("Email service not configured. Cannot send email notification.");
            return;
        }
        emailService.get().sendNotification(notification);
    }

    public void sendNotificationViaApprise(Notification notification, Habit habit) {
        if (!isAppriseActive()) {
            log.debug("No Apprise target specified for notification {}", notification.getId());
            return;
        }

        if (habit == null) {
            log.debug("Could not find habit for notification with id {}. Cannot send apprise notification",
                    notification.getId());
            return;
        }
        String appriseTarget = this.getAppriseTargetFromHabit(habit);

        if (appriseApiUrl == null || appriseApiUrl.isEmpty()) {
            log.debug("Apprise API URL not configured");
            return;
        }

        try {
            MultiValueMap<String, Object> payload = new LinkedMultiValueMap<>();
            payload.add("urls", appriseTarget);
            payload.add("title", notification.getSubject());
            payload.add("body", notification.getContent());
            payload.add("type", "info");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(payload, headers);

            String endpoint = appriseApiUrl + "/notify";
            restTemplate.postForEntity(endpoint, request, String.class);

            log.info("Successfully sent Apprise notification to target: {}", appriseTarget);

        } catch (RestClientException e) {
            log.error("Failed to send Apprise notification to target {}: {}",
                    appriseTarget, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending Apprise notification: {}", e.getMessage());
        }
    }

    public boolean isAppriseActive() {
        return appriseApiUrl != null && !appriseApiUrl.isEmpty();
    }

    private String getAppriseTargetFromHabit(Habit habit) {
        String json = habit.getReminderCustom();
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            NotificationConfigDTO frequencyDTO =
                    mapper.readValue(json, NotificationConfigDTO.class);
            String target = frequencyDTO.getAppriseTarget();
            if (target == null || target.isEmpty()) {
                if (!habit.getAccount().getAppriseTargetUrls().isEmpty()) {
                    return habit.getAccount().getAppriseTargetUrls();
                }
                return null;
            }
            return target;
        } catch (JsonProcessingException e) {
            log.warn("Could not parse reminderCustom for habit {}", habit.getUuid(), e);
            return null;
        }
    }

    private String getIdentifierFromRule(NotificationConfigRuleDTO rule, Habit habit) {
        return getIdentifierFromRule(rule, habit, null);
    }

    private String getIdentifierFromRule(NotificationConfigRuleDTO rule, Habit habit, Habit otherHabit) {
        return switch (rule.getType()) {
            case NotificationTypeEnum.threshold -> "THRESHOLD_" + habit.getUuid();
            case NotificationTypeEnum.overtake -> "OVERTAKE_" + habit.getUuid() + "_" + otherHabit.getUuid();
            default -> null;
        };
    }

    private boolean isFirstCheckToday() {
        LocalTime currentTime = LocalTime.now();
        return currentTime.getHour() == 0 && currentTime.getMinute() <= 10;
    }
}
