package de.jofoerster.habitsync.service.notification;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.notification.*;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.repository.habit.SharedHabitRepository;
import de.jofoerster.habitsync.repository.notification.NotificationRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotificationService {

    private static final Map<String, LocalDateTime> lastUpdateByUser = new HashMap<>();
    @Value("${base.url}")
    String baseUrl;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private JavaMailSender emailSender;
    @Autowired
    private SharedHabitRepository sharedHabitRepository;
    @Autowired
    private TemplateEngine templateEngine;
    @Autowired
    private Scheduler scheduler;
    @Autowired
    private NotificationRuleService notificationRuleService;
    @Autowired
    private HabitRecordRepository habitRecordRepository;
    @Autowired
    private NotificationTemplateService notificationTemplateService;

    public void scheduleNotificationJob(Account account) {
        log.info("Schedule notification job for account {}", account.getAuthenticationId());
        JobKey jobKey = JobKey.jobKey("notifyJob_" + account.getAuthenticationId(), "notifications");
        TriggerKey triggerKey =
                TriggerKey.triggerKey("notifyTrigger_" + account.getAuthenticationId(), "notifications");
        try {
            if (scheduler.checkExists(jobKey)) {
                log.debug("Job {} already exists", jobKey);
                Trigger newTrigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey)
                        .withSchedule(
                                CronScheduleBuilder.dailyAtHourAndMinute(account.getNotificationCreationHour(), 0))
                        .forJob(jobKey)
                        .build();

                scheduler.rescheduleJob(triggerKey, newTrigger);
            } else {
                log.debug("Job {} does not exist, creating new", jobKey);
                JobDetail jobDetail = JobBuilder.newJob(NotificationJob.class)
                        .withIdentity(jobKey)
                        .usingJobData("userId", account.getAuthenticationId())
                        .build();

                Trigger trigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey)
                        .withSchedule(
                                CronScheduleBuilder.dailyAtHourAndMinute(account.getNotificationCreationHour(), 0))
                        .forJob(jobDetail)
                        .build();

                scheduler.scheduleJob(jobDetail, trigger);
            }
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
    }

    public void removeNotificationJob(Account account) {
        log.info("Remove notification job for account {}", account.getAuthenticationId());
        JobKey jobKey = JobKey.jobKey("notifyJob_" + account.getAuthenticationId(), "notifications");
        try {
            if (scheduler.checkExists(jobKey)) {
                log.debug("Job to delete {} exists", jobKey);
                scheduler.deleteJob(jobKey);
            }
        } catch (SchedulerException ignored) {
            log.error(ignored.getMessage());
        }
    }

    public void createAndSendNotificationsForUser(Account account) {
        log.info("Create and send notifications for user {}", account.getAuthenticationId());
        this.createNotificationsForUser(account);
        this.deduplicateNotifications(account);
        if (getNumberOfPendingNotificationsForAccount(account) == 0) {
            return;
        }
        List<Notification> notifications =
                notificationRepository.getAllNotificationsFilteredByStatusAndReceiverAccount(NotificationStatus.WAITING,
                        account);
        String mailContent = getMailNotificationContent(notifications);

        MimeMessage mimeMessage = emailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("habitsync@jntn.de");
            helper.setTo(account.getEmail());
            helper.setSubject("Habit sync notifications");
            helper.setText(mailContent, true); // true = isHtml

            emailSender.send(mimeMessage);
        } catch (MessagingException ignored) {
        }
    }

    public void createNotificationsForUser(Account account) {
        List<SharedHabit> sharedHabits = sharedHabitRepository.findAll()
                .stream()
                .filter(sharedHabit -> sharedHabit.getHabits()
                        .stream()
                        .map(h -> h.getAccount())
                        .toList()
                        .contains(account))
                .toList();
        createNotificationsForSharedHabitsForUser(sharedHabits, account);
    }

    private void createNotificationsForSharedHabitsForUser(List<SharedHabit> sharedHabits, Account account) {
        sharedHabits.forEach(sh -> createNotificationsForSharedHabitForUser(sh, account));
    }

    public void createNotificationsForSharedHabitForUser(SharedHabit sharedHabit, Account account) {
        sharedHabit.getStatusOfAllHabits(notificationRuleService, new HabitRecordSupplier(habitRecordRepository))
                .forEach((rule, map) -> {
                    map.get(account)
                            .forEach((b, habit) -> {
                                if (b) {
                                    notificationRepository.save(rule.getNotificationTemplate()
                                            .createNotification(account, Optional.empty(), sharedHabit, rule,
                                                    templateEngine, notificationRuleService,
                                                    new HabitRecordSupplier(habitRecordRepository), baseUrl));
                                }
                            });
                });
    }

    public void deduplicateNotifications(List<Notification> notifications) {
        log.debug("Deduplicate notifications {}", notifications);
        Set<Integer> identifiers = notifications.stream()
                .map(Notification::getIdentifier)
                .collect(Collectors.toSet());
        identifiers.forEach(id -> {
            List<Notification> ns = notificationRepository.getNotificationsByIdentifierOrderByTimestampAsc(id);
            int count = ns.size();
            for (Notification n : ns) {
                if (n.getStatus() != NotificationStatus.WAITING) {
                    ns.forEach(ntoDelete -> {
                        if (ntoDelete != n && n.getTimestamp()
                                .plusDays(7L)
                                .isAfter(ntoDelete.getTimestamp())) {
                            notificationRepository.delete(ntoDelete);
                        }
                    });
                    break;
                }
            }
            if (notificationRepository.getNotificationsByIdentifierOrderByTimestampAsc(id)
                    .size() > 1) {
                ns.stream()
                        .sorted(Comparator.comparing(Notification::getTimestamp)
                                .reversed())
                        .skip(1)
                        .forEach(n -> {
                            notificationRepository.delete(n);
                        });
            }

        });
    }

    public void deduplicateNotifications(Account account) {
        List<Notification> notifications = notificationRepository.findAllByReceiverAccount(account);
        deduplicateNotifications(notifications);
    }

    public void sendNotificationViaMail(Notification notification) {
        MimeMessage mimeMessage = emailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("habitsync@jntn.de");
            helper.setTo(notification.getReceiverAccount()
                    .getEmail());
            helper.setSubject(notification.getSubject());
            helper.setText(notification.getContent(), true); // true = isHtml

            emailSender.send(mimeMessage);
        } catch (MessagingException ignored) {
        }
    }

    public boolean markAsRead(Long id) {
        Optional<Notification> notification = notificationRepository.findById(id);
        if (!notification.isPresent()) {
            return false;
        }
        Notification notificationToUpdate = notification.get();
        notificationToUpdate.setStatus(NotificationStatus.VIEWED);
        notificationRepository.save(notificationToUpdate);
        return true;
    }

    public Optional<Notification> getNotificationById(Long id) {
        return notificationRepository.findById(id);
    }

    public boolean deleteNotification(Long id) {
        Optional<Notification> notification = notificationRepository.findById(id);
        if (!notification.isPresent()) {
            return false;
        } else {
            Notification notificationToDelete = notification.get();
            notificationToDelete.setStatus(NotificationStatus.DELETED);
            notificationRepository.save(notificationToDelete);
            //notificationRepository.delete(notification.get()); TODO delete after some time
            return true;
        }
    }

    public void markAllAsReadForUser(Account account) {
        notificationRepository.getNotificationByReceiverAccountAndStatusIn(account,
                        List.of(NotificationStatus.WAITING, NotificationStatus.SENT))
                .forEach(notification -> {
                    notification.setStatus(NotificationStatus.VIEWED);
                    notificationRepository.save(notification);
                });

    }

    public Integer getNumberOfPendingNotificationsForAccount(Account account) {
        return notificationRepository.countNotificationsFilteredByReceiverAccountAndStatusIn(account,
                List.of(NotificationStatus.WAITING, NotificationStatus.SENT));
    }

    public List<Notification> getAllNotificationsForAccount(Account account) {
        return notificationRepository.getNotificationByReceiverAccountAndStatusIn(account,
                List.of(NotificationStatus.WAITING, NotificationStatus.VIEWED));
    }

    public void updateDataOfUserIfNeeded(Account account) {
        if (lastUpdateByUser.get(account.getAuthenticationId()) == null ||
                lastUpdateByUser.get(account.getAuthenticationId())
                        .isBefore(LocalDateTime.now()
                                .minusMinutes(30))) {
            createNotificationsForUser(
                    account); // TODO do not create duplicate notifications so they do not have to be deduplicated
            deduplicateNotifications(account);
            lastUpdateByUser.put(account.getAuthenticationId(), LocalDateTime.now());
        }
    }

    public String getMailNotificationContent(List<Notification> notifications) {
        notifications.sort(Comparator.comparing(Notification::getSharedHabitIt));
        List<String> htmlSnippets = new ArrayList<>();
        Notification previous = null;

        for (Notification current : notifications) {
            if (previous != null && Objects.equals(previous.getSharedHabitIt(), current.getSharedHabitIt())) {
                htmlSnippets.add(current.getHtmlContentShadeMinimal());
            } else {
                htmlSnippets.add(current.getHtmlContentShade());
            }
            previous = current;
        }

        Context context = new Context();
        context.setVariable("htmlSnippets", htmlSnippets);
        return templateEngine.process("notification-templates/notification-template-multi-mail", context);
    }

    public void pingOtherUser(Account senderAccount, Account receiverAccount, SharedHabit sharedHabit) {
        NotificationTemplate notificationTemplate =
                notificationTemplateService.getNotificationTemplateByNotificationType(
                        NotificationType.PING_FROM_OTHER_USER);
        NotificationRule notificationRule =
                sharedHabit.getTemporaryMainNotificationRule(notificationRuleService, notificationTemplate);
        Notification notification =
                notificationTemplate.createNotification(receiverAccount, Optional.of(senderAccount), sharedHabit,
                        notificationRule, templateEngine, notificationRuleService,
                        new HabitRecordSupplier(habitRecordRepository), baseUrl);
        notificationRepository.save(notification);
        sendNotificationViaMail(notification); //TODO check that notification is not being sent multiple times
    }
}
