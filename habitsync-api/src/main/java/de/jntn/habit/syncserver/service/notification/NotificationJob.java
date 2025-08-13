package de.jntn.habit.syncserver.service.notification;

import de.jntn.habit.syncserver.service.account.AccountService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;

public class NotificationJob implements Job {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AccountService accountService;

    @Override
    public void execute(JobExecutionContext context) {
        String userId = context.getJobDetail()
                .getJobDataMap()
                .getString("userId");
        notificationService.createAndSendNotificationsForUser(accountService.getOrCreateAccountById(userId));
    }
}