package de.jofoerster.habitsync.service.notification;

import de.jofoerster.habitsync.service.account.AccountService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;

public class PushNotificationJob implements Job {

    @Autowired
    private NotificationServiceNew notificationService;

    @Autowired
    private AccountService accountService;

    @Override
    public void execute(JobExecutionContext context) {
        String id = context.getJobDetail()
                .getJobDataMap()
                .getString("id");
        notificationService.sendPushNotifications(id);
    }
}