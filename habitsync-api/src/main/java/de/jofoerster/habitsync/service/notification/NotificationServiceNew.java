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
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.TemplateEngine;

import java.util.HashMap;
import java.util.Map;
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
    private final JavaMailSender emailSender;
    private final ResourceLoader resourceLoader;
    private final RestTemplate restTemplate = new RestTemplate();

    ObjectMapper mapper = new ObjectMapper();

    @Value("${spring.mail.username}")
    private String mailSender;

    @Value("${base.url}")
    String baseUrl;

    @Value("${apprise.api.url:}")
    String appriseApiUrl;

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
                        NotificationStatus.STATELESS_NOTIFICATION, resourceLoader);
        sendNotificationViaApprise(notification, habit);
        if (habit.getAccount().isSendNotificationsViaEmail()){
            sendNotificationViaMail(notification);
        }
    }

    public void sendNotificationViaMail(Notification notification) {
        if (notification.getReceiverAccount() == null || notification.getReceiverAccount().getEmail() == null) {
            return;
        }
        MimeMessage mimeMessage = emailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailSender);
            helper.setTo(notification.getReceiverAccount()
                    .getEmail());
            helper.setSubject(notification.getSubject());
            helper.setText(notification.getHtmlContent(), true); // true = isHtml

            emailSender.send(mimeMessage);
        } catch (MessagingException ignored) {
        }
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
            NotificationFrequencyDTO frequencyDTO =
                    mapper.readValue(json, NotificationFrequencyDTO.class);
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
}
