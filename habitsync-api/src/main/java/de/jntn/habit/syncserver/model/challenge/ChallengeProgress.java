package de.jntn.habit.syncserver.model.challenge;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ChallengeProgress {
    Double percentage;
    Double total;
    String challengeUnit;
    Double maxValue;
    String linkToHabit;
}
