package de.jofoerster.habitsync.model.challenge;

public enum ChallengeComputationType {
    RELATIVE("Percentage relative to other participants"), ABSOLUTE("Normal percentage of each user"), MAX_VALUE(
            "Highest recorded record");

    private final String description;

    ChallengeComputationType(String description) {
        this.description = description;
    }
}
