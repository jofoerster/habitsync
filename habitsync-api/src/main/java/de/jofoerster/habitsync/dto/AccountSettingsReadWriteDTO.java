package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountSettingsReadWriteDTO {
    private String displayName;
    private String email;
    private String authenticationId;

    private Boolean isEmailNotificationsEnabled;

    private Boolean isPushNotificationsEnabled;

    private Integer dailyNotificationHour;

    private String appriseTarget;
}
