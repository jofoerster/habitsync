package de.jofoerster.habitsync.service.notification;

import de.jofoerster.habitsync.dto.NotificationConfigDTO;
import de.jofoerster.habitsync.dto.NotificationConfigRuleDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulingService {

    private final Scheduler scheduler;

    public void scheduleNotificationJob(String id, NotificationConfigRuleDTO notificationRuleConfig) {
        log.debug("Schedule notification job for habit {}", id);
        JobKey jobKey = JobKey.jobKey("notifyJob_" + id, "notifications");
        TriggerKey triggerKey =
                TriggerKey.triggerKey("notifyTrigger_" + id, "notifications");
        try {
            if (scheduler.checkExists(jobKey)) {
                log.debug("Job {} already exists", jobKey);
                Trigger newTrigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey)
                        .withSchedule(getScheduleFromFrequency(notificationRuleConfig))
                        .forJob(jobKey)
                        .build();

                scheduler.rescheduleJob(triggerKey, newTrigger);
            } else {
                log.debug("Job {} does not exist, creating new", jobKey);
                JobDetail jobDetail = JobBuilder.newJob(PushNotificationJob.class)
                        .withIdentity(jobKey)
                        .usingJobData("jobId", id)
                        .build();

                Trigger trigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey)
                        .withSchedule(getScheduleFromFrequency(notificationRuleConfig))
                        .forJob(jobDetail)
                        .build();

                scheduler.scheduleJob(jobDetail, trigger);
            }
        } catch (SchedulerException e) {
            log.error("Failed to schedule notification job for habit {}", id, e);
        }
    }

    public void removeNotificationJob(String id) {
        log.debug("Remove notification job for habit {}", id);
        JobKey jobKey = JobKey.jobKey("notifyJob_" + id, "notifications");
        try {
            if (scheduler.checkExists(jobKey)) {
                log.debug("Job to delete {} exists", jobKey);
                scheduler.deleteJob(jobKey);
            }
        } catch (SchedulerException ignored) {
            log.error(ignored.getMessage());
        }
    }

    public CronScheduleBuilder getScheduleFromFrequency(NotificationConfigRuleDTO frequency) {
        if (frequency == null || frequency.getTime() == null) {
            throw new IllegalArgumentException("Frequency and time cannot be null");
        }

        String[] timeParts = frequency.getTime().split(":");
        if (timeParts.length != 2) {
            throw new IllegalArgumentException("Time must be in format HH:mm");
        }

        int hour = Integer.parseInt(timeParts[0]);
        int minute = Integer.parseInt(timeParts[1]);

        if (frequency.getFrequency() == null) {
            throw new IllegalArgumentException("Frequency type cannot be null");
        }

        switch (frequency.getFrequency()) {
            case daily:
                return CronScheduleBuilder.cronSchedule(String.format("0 %d %d * * ?", minute, hour));

            case weekly:
                if (frequency.getWeekdays() == null || frequency.getWeekdays().length == 0) {
                    throw new IllegalArgumentException("Weekdays must be specified for weekly frequency");
                }

                StringBuilder daysOfWeek = new StringBuilder();
                for (int i = 0; i < frequency.getWeekdays().length; i++) {
                    if (i > 0) {
                        daysOfWeek.append(",");
                    }
                    daysOfWeek.append(convertWeekdayToCron(frequency.getWeekdays()[i]));
                }

                return CronScheduleBuilder.cronSchedule(String.format("0 %d %d ? * %s", minute, hour, daysOfWeek));

            default:
                throw new IllegalArgumentException("Unsupported frequency type: " + frequency.getFrequency());
        }
    }

    private String convertWeekdayToCron(String weekday) {
        return switch (weekday.toUpperCase()) {
            case "MO" -> "MON";
            case "TU" -> "TUE";
            case "WE" -> "WED";
            case "TH" -> "THU";
            case "FR" -> "FRI";
            case "SA" -> "SAT";
            case "SU" -> "SUN";
            default -> throw new IllegalArgumentException("Invalid weekday: " + weekday);
        };
    }
}
