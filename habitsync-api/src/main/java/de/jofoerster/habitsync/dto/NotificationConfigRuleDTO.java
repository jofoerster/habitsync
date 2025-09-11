package de.jofoerster.habitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationConfigRuleDTO {
    private NotificationTypeEnum type;
    private boolean enabled;

    // Fixed time notifications
    private FrequencyEnum frequency;
    private String[] weekdays; // MO, TU, WE, TH, FR, SA, SU
    private String time;
    private Boolean triggerIfFulfilled = false;

    // Threshold notifications
    private Long thresholdPercentage; // percentage

    // Overtake notifications
    // no parameters needed
}
