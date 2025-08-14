package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChallengeProgressReadDTO {
    private AccountReadDTO account;
    private String linkToHabit;
    private Double percentage;
    private Double maxValue;
    private Double absoluteValue;
}
