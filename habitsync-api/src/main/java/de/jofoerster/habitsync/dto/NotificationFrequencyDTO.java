package de.jofoerster.habitsync.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class NotificationFrequencyDTO {
    private FrequencyEnum frequency;
    private String[] weekdays; // MO, TU, WE, TH, FR, SA, SU
    private String time;
}

enum FrequencyEnum {
    daily,
    weekly;

    @JsonCreator
    public static FrequencyEnum fromString(String value) {
        return FrequencyEnum.valueOf(value);
    }
}