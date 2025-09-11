package de.jofoerster.habitsync.model.notification;

import de.jofoerster.habitsync.dto.NotificationConfigRuleDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
import jakarta.persistence.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Data
@Entity
@Slf4j
public class NotificationTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(columnDefinition = "TEXT")
    String subjectTemplate;

    String contentTemplateName;

    String htmlTemplateName;

    String htmlShadeTemplateName;

    String htmlShadeMinimalTemplateName;

    private NotificationType notificationType;

    public NotificationTemplate() {
    }

    public Notification createNotification(Account receiver, Optional<Account> sender, SharedHabit sharedHabit,
                                           Habit habit,
                                           NotificationRule rule, TemplateEngine templateEngine,
                                           NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                           String baseUrl, NotificationStatus notificationStatus,
                                           ResourceLoader resourceLoader,
                                           NotificationConfigRuleDTO notificationConfigRule) {
        String subject =
                getSubjectContent(sender, receiver, sharedHabit, habit, rule, templateEngine, ruleService,
                        recordSupplier, notificationConfigRule);
        return Notification.builder()
                .content(getNotificationPlainContent(sender, receiver, sharedHabit, habit, rule, templateEngine,
                        ruleService,
                        recordSupplier, resourceLoader, notificationConfigRule))
                .htmlContent(
                        getNotificationHtmlContent(templateEngine, receiver, sender, sharedHabit, habit, ruleService,
                                recordSupplier, baseUrl, subject))
                .htmlContentShade(
                        getNotificationShadeContent(templateEngine, receiver, sender, sharedHabit, habit, ruleService,
                                recordSupplier, baseUrl, subject))
                .htmlContentShadeMinimal(
                        getNotificationShadeContentMinimal(templateEngine, receiver, sender, sharedHabit, habit,
                                ruleService,
                                recordSupplier, baseUrl, subject))
                .subject(subject)
                .receiverAccount(receiver)
                .senderAccount(getSenderAccount(sender))
                .identifier(receiver.getUserName()
                        .hashCode() + (sharedHabit != null ? sharedHabit.getId().hashCode() : 0) +
                        (rule != null ? rule.getId().hashCode() : 0) + getHashCodeOfSenderAccount(sender))
                .status(notificationStatus == null ? NotificationStatus.WAITING : notificationStatus)
                .timestamp(LocalDateTime.now())
                .sharedHabitIt(sharedHabit != null ? sharedHabit.getId() : null)
                .build();
    }

    private Account getSenderAccount(Optional<Account> sender) {
        if (notificationType == NotificationType.PING_FROM_OTHER_USER) {
            if (sender.isPresent()) {
                return sender.get();
            }
        }
        return null;
    }

    private int getHashCodeOfSenderAccount(Optional<Account> sender) {
        return Math.toIntExact(sender.map(account -> account.getAuthenticationId()
                        .hashCode())
                .orElse(0));
    }

    private String getNotificationHtmlContent(TemplateEngine templateEngine, Account receiver, Optional<Account> sender,
                                              SharedHabit sharedHabit, Habit habit, NotificationRuleService ruleService,
                                              HabitRecordSupplier recordSupplier, String baseurl, String subject) {
        Context context = new Context();
        context.setVariables(
                getNotificationVariables(receiver, sender, sharedHabit, habit, ruleService, recordSupplier, baseurl,
                        subject));
        return templateEngine.process(htmlTemplateName, context);
    }

    private String getNotificationShadeContent(TemplateEngine templateEngine, Account receiver,
                                               Optional<Account> sender, SharedHabit sharedHabit, Habit habit,
                                               NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                               String baseurl, String subject) {
        if (htmlShadeTemplateName == null || htmlShadeTemplateName.isEmpty()) {
            return "";
        }
        Context context = new Context();
        context.setVariables(
                getNotificationVariables(receiver, sender, sharedHabit, habit, ruleService, recordSupplier, baseurl,
                        subject));
        return templateEngine.process(htmlShadeTemplateName, context);
    }

    private String getNotificationShadeContentMinimal(TemplateEngine templateEngine, Account receiver,
                                                      Optional<Account> sender, SharedHabit sharedHabit, Habit habit,
                                                      NotificationRuleService ruleService,
                                                      HabitRecordSupplier recordSupplier, String baseUrl,
                                                      String subject) {
        if (htmlShadeMinimalTemplateName == null || htmlShadeMinimalTemplateName.isEmpty()) {
            return "";
        }
        Context context = new Context();
        context.setVariables(
                getNotificationVariables(receiver, sender, sharedHabit, habit, ruleService, recordSupplier, baseUrl,
                        subject));
        return templateEngine.process(htmlShadeMinimalTemplateName, context);
    }

    private String getSubjectContent(Optional<Account> sender, Account receiver, SharedHabit sharedHabit, Habit habit,
                                     NotificationRule rule, TemplateEngine templateEngine,
                                     NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                     NotificationConfigRuleDTO notificationConfigRule) {
        return getPlainContent(subjectTemplate, sender, receiver, sharedHabit, habit, rule, templateEngine, ruleService,
                recordSupplier, notificationConfigRule);
    }

    private String getNotificationPlainContent(Optional<Account> sender, Account receiver, SharedHabit sharedHabit,
                                               Habit habit,
                                               NotificationRule rule, TemplateEngine templateEngine,
                                               NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                               ResourceLoader resourceLoader, NotificationConfigRuleDTO notificationConfigRule) {
        return getPlainContent(getContentTemplateString(resourceLoader), sender, receiver, sharedHabit, habit, rule,
                templateEngine, ruleService,
                recordSupplier, notificationConfigRule);
    }

    private String getPlainContent(String template, Optional<Account> sender, Account receiver, SharedHabit sharedHabit,
                                   Habit habit,
                                   NotificationRule rule, TemplateEngine templateEngine,
                                   NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                   NotificationConfigRuleDTO notificationConfigRule) {
        Map<String, String> parameters = new HashMap<>();
        if (sharedHabit != null) {
            parameters.put("sharedHabitName", sharedHabit.getTitle());
            sharedHabit.getHabitByOwner(receiver)
                    .ifPresent(h -> parameters.put("noRecordsForDays",
                            recordSupplier.getTimeSinceLastRecordByHabit(h)
                                    .toString()));
        }
        if (habit != null) {
            parameters.put("habitName", habit.getName());
        }
        if (rule != null) {
            Integer percentageForN = rule.getPercentageOfGoalForNotificationTrigger();
            parameters.put("percentage", String.valueOf(percentageForN));
        }
        if (habit != null && recordSupplier != null) {
            parameters.put("percentage", String.valueOf(Math.round(habit.getCompletionPercentage(recordSupplier))));
        }
        if (notificationConfigRule != null && notificationConfigRule.getThreshold() != null) {
            parameters.put("threshold", String.valueOf(notificationConfigRule.getThreshold()));
        }

        parameters.put("receiver", receiver.getDisplayName());
        parameters.put("senderName", sender.isPresent() ? sender.get()
                .getDisplayName() : "");
        if (template == null) return "";
        return renderTemplate(template, parameters);
    }

    private Map<String, Object> getNotificationVariables(Account receiver, Optional<Account> sender,
                                                         SharedHabit sharedHabit, Habit habit,
                                                         NotificationRuleService notificationRuleService,
                                                         HabitRecordSupplier habitRecordSupplier, String baseUrl,
                                                         String subject) {
        HashMap<String, Object> parameters = new HashMap<>();
        parameters.put("baseUrl", baseUrl);
        parameters.put("receiver", receiver);
        parameters.put("subject", subject);
        if (sharedHabit != null) {
            parameters.put("sharedHabits", List.of(sharedHabit));
            int maxProgress = (int) Math.round(sharedHabit.getHabits()
                    .stream()
                    .map(h -> sharedHabit.getProgressOfHabit(h, notificationRuleService, habitRecordSupplier))
                    .max(Comparator.naturalOrder())
                    .orElse(0d));
            parameters.put("maxProgress", maxProgress);
        }
        parameters.put("habit", habit);
        parameters.put("notificationRuleService", notificationRuleService);
        parameters.put("habitRecordSupplier", habitRecordSupplier);
        sender.ifPresent(account -> parameters.put("sender", account.getUserName()));

        return parameters;
    }

    private String renderTemplate(String template, Map<String, String> parameters) {
        String rendered = template;
        if (parameters != null) {
            for (Map.Entry<String, String> entry : parameters.entrySet()) {
                rendered = rendered.replace("${" + entry.getKey() + "}", entry.getValue());
            }
        }
        return rendered;
    }

    private String getContentTemplateString(ResourceLoader resourceLoader) {
        try {
            Resource resource = resourceLoader.getResource("classpath:templates/" + contentTemplateName + ".txt");
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to load template: " + contentTemplateName, e);
        }
        return "";
    }
}
