package de.jofoerster.habitsync.service.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.jofoerster.habitsync.dto.NotificationFrequencyDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.notification.Notification;
import de.jofoerster.habitsync.model.notification.NotificationStatus;
import de.jofoerster.habitsync.model.notification.NotificationTemplate;
import de.jofoerster.habitsync.model.notification.NotificationType;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.service.habit.HabitService;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationServiceNew {

    private final HabitService habitService;
    private final SchedulingService schedulingService;
    private final NotificationTemplateService notificationTemplateService;
    private final TemplateEngine templateEngine;
    private final NotificationRuleService notificationRuleService;
    private final HabitRecordRepository habitRecordRepository;
    private JavaMailSender emailSender;

    ObjectMapper mapper = new ObjectMapper();

    @Value("${spring.mail.username}")
    private String mailSender;

    @Value("${base.url}")
    String baseUrl;

    @PostConstruct
    public void init() {
        log.info("Scheduling user notification jobs");
        habitService.getHabitsWithReminders().forEach(h -> {
            schedulingService.scheduleNotificationJob(h.getUuid(), habitService.getNotificationFrequency(h));
        });
    }

    public boolean createOrUpdateNotificationForHabit(Habit habit, NotificationFrequencyDTO frequency) {
        try {
            habit.setReminderCustom(mapper.writeValueAsString(frequency));
            habitService.saveHabit(habit);
            schedulingService.scheduleNotificationJob(habit.getUuid(), frequency);
            return true;
        } catch (JsonProcessingException e) {
            log.warn("Could not set reminderCustom for habit {}", habit.getUuid(), e);
            return false;
        }
    }

    public boolean deleteNotificationForHabit(Habit habit) {
        habit.setReminderCustom(null);
        habitService.saveHabit(habit);
        schedulingService.removeNotificationJob(habit.getUuid());
        return true;
    }

    public void sendPushNotifications(String id) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(id);
        if (habitOpt.isEmpty()) {
            log.warn("Could not find habit with id {}", id);
            return;
        }
        NotificationTemplate notificationTemplate =
                notificationTemplateService.getNotificationTemplateByNotificationType(
                        NotificationType.PUSH_NOTIFICATION_HABIT);
        Habit habit = habitOpt.get();
        Notification notification =
                notificationTemplate.createNotification(habit.getAccount(), Optional.empty(), null, habit, null,
                        templateEngine,
                        notificationRuleService, new HabitRecordSupplier(habitRecordRepository), baseUrl,
                        NotificationStatus.STATELESS_NOTIFICATION);
        sendNotificationViaMail(notification);
    }

    public void sendNotificationViaMail(Notification notification) {
        MimeMessage mimeMessage = emailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailSender);
            helper.setTo(notification.getReceiverAccount()
                    .getEmail());
            helper.setSubject(notification.getSubject());
            helper.setText(notification.getContent(), true); // true = isHtml

            emailSender.send(mimeMessage);
        } catch (MessagingException ignored) {
        }
    }
}
