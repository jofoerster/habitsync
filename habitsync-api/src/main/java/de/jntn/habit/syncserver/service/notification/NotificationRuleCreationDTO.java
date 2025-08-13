package de.jntn.habit.syncserver.service.notification;

import lombok.Data;

@Data
public class NotificationRuleCreationDTO {

    Integer index;
    String notificationType;
    String notificationTypeLabel;
    Integer percentageNeeded;
    Integer numberOfDays;
    Double dailyScore;
    Double dailyReachableValue;
    String dailyScoreUnit;
    Integer freqType;
    Integer freqCustomSingle;
    Integer freqCustomTimes;
    Integer freqCustomDays;
    Integer targetDays;
    //shared habit connection
    String sharedHabitShareCode;
    private Long id;
}
