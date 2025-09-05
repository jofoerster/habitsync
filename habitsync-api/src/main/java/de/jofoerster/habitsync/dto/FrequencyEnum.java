package de.jofoerster.habitsync.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum FrequencyEnum {
    daily,
    weekly;

    @JsonCreator
    public static FrequencyEnum fromString(String value) {
        return FrequencyEnum.valueOf(value);
    }
}
