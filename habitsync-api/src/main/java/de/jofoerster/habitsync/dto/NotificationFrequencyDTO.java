package de.jofoerster.habitsync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class NotificationFrequencyDTO {
    private FrequencyEnum frequency;
    private String[] weekdays; // MO, TU, WE, TH, FR, SA, SU
    private String time;
    private String appriseTarget; // optional, only for custom target
}

