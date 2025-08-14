package de.jofoerster.habitsync.model.notification;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
import jakarta.persistence.*;
import lombok.Data;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Entity
public class NotificationTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(columnDefinition = "TEXT")
    String subjectTemplate;

    String htmlTemplateName;

    String htmlShadeTemplateName;

    String htmlShadeMinimalTemplateName;

    private NotificationType notificationType;

    public NotificationTemplate() {
    }

    public Notification createNotification(Account receiver, Optional<Account> sender, SharedHabit sharedHabit,
                                           NotificationRule rule, TemplateEngine templateEngine,
                                           NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                           String baseUrl) {
        String subject =
                getSubjectContent(sender, receiver, sharedHabit, rule, templateEngine, ruleService, recordSupplier);
        return Notification.builder()
                .content(getNotificationContent(templateEngine, receiver, sender, sharedHabit, ruleService,
                        recordSupplier, baseUrl, subject))
                .htmlContentShade(
                        getNotificationShadeContent(templateEngine, receiver, sender, sharedHabit, ruleService,
                                recordSupplier, baseUrl, subject))
                .htmlContentShadeMinimal(
                        getNotificationShadeContentMinimal(templateEngine, receiver, sender, sharedHabit, ruleService,
                                recordSupplier, baseUrl, subject))
                .subject(subject)
                .receiverAccount(receiver)
                .senderAccount(getSenderAccount(sender))
                .identifier(receiver.getUserName()
                        .hashCode() + sharedHabit.getId()
                        .hashCode() + rule.getId()
                        .hashCode() + getHashCodeOfSenderAccount(sender))
                .status(NotificationStatus.WAITING)
                .timestamp(LocalDateTime.now())
                .sharedHabitIt(sharedHabit.getId())
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

    private String getNotificationContent(TemplateEngine templateEngine, Account receiver, Optional<Account> sender,
                                          SharedHabit sharedHabit, NotificationRuleService ruleService,
                                          HabitRecordSupplier recordSupplier, String baseurl, String subject) {
        Context context = new Context();
        context.setVariables(
                getNotificationVariables(receiver, sender, sharedHabit, ruleService, recordSupplier, baseurl, subject));
        return templateEngine.process(htmlTemplateName, context);
    }

    private String getNotificationShadeContent(TemplateEngine templateEngine, Account receiver,
                                               Optional<Account> sender, SharedHabit sharedHabit,
                                               NotificationRuleService ruleService, HabitRecordSupplier recordSupplier,
                                               String baseurl, String subject) {
        Context context = new Context();
        context.setVariables(
                getNotificationVariables(receiver, sender, sharedHabit, ruleService, recordSupplier, baseurl, subject));
        return templateEngine.process(htmlShadeTemplateName, context);
    }

    private String getNotificationShadeContentMinimal(TemplateEngine templateEngine, Account receiver,
                                                      Optional<Account> sender, SharedHabit sharedHabit,
                                                      NotificationRuleService ruleService,
                                                      HabitRecordSupplier recordSupplier, String baseUrl,
                                                      String subject) {
        Context context = new Context();
        context.setVariables(
                getNotificationVariables(receiver, sender, sharedHabit, ruleService, recordSupplier, baseUrl, subject));
        return templateEngine.process(htmlShadeMinimalTemplateName, context);
    }

    private String getSubjectContent(Optional<Account> sender, Account receiver, SharedHabit sharedHabit,
                                     NotificationRule rule, TemplateEngine templateEngine,
                                     NotificationRuleService ruleService, HabitRecordSupplier recordSupplier) {
        Map<String, String> parameters = new HashMap<>();
        parameters.put("sharedHabitName", sharedHabit.getTitle());
        Integer percentageForN = rule.getPercentageOfGoalForNotificationTrigger();
        parameters.put("percentage", String.valueOf(percentageForN));
        sharedHabit.getHabitByOwner(receiver)
                .ifPresent(habit -> parameters.put("noRecordsForDays",
                        recordSupplier.getTimeSinceLastRecordByHabit(habit)
                                .toString()));

        parameters.put("receiver", receiver.getDisplayName());
        parameters.put("senderName", sender.isPresent() ? sender.get()
                .getDisplayName() : "");
        if (subjectTemplate == null) return "";
        return renderTemplate(subjectTemplate, parameters);
    }

    private Map<String, Object> getNotificationVariables(Account receiver, Optional<Account> sender,
                                                         SharedHabit sharedHabit,
                                                         NotificationRuleService notificationRuleService,
                                                         HabitRecordSupplier habitRecordSupplier, String baseUrl,
                                                         String subject) {
        HashMap<String, Object> parameters = new HashMap<>();
        parameters.put("baseUrl", baseUrl);
        parameters.put("receiver", receiver);
        parameters.put("subject", subject);
        parameters.put("sharedHabits", List.of(sharedHabit));
        parameters.put("notificationRuleService", notificationRuleService);
        parameters.put("habitRecordSupplier", habitRecordSupplier);
        sender.ifPresent(account -> parameters.put("sender", account.getUserName()));

        int maxProgress = (int) Math.round(sharedHabit.getHabits()
                .stream()
                .map(habit -> sharedHabit.getProgressOfHabit(habit, notificationRuleService, habitRecordSupplier))
                .max(Comparator.naturalOrder())
                .orElse(0d));
        parameters.put("maxProgress", maxProgress);

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
}
