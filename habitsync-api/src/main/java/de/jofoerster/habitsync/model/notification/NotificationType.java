package de.jofoerster.habitsync.model.notification;

public enum NotificationType {
    PERCENTAGE_REACHED_BY_SOMEONE_ELSE("Percentage Reached",
            "${sharedHabitName}: Someone has reached ${percentage}% of this shared habit"),
    PERCENTAGE_REACHED_BY_ANYONE(
            "Percentage Reached",
            "${sharedHabitName}: Someone has reached ${percentage}% of this shared habit"), NEW_RECORD_OF_OTHER_USER(
            "New Record", "${sharedHabitName}: Someone has submitted new records"), NO_OWN_RECORD_FOR_CERTAIN_TIME(
            "No Own Record",
            "${sharedHabitName}: You did not submit any records for ${noRecordsForDays} days"), PING_FROM_OTHER_USER(
            "Ping", "${sharedHabitName}: Ping from ${senderName}"), CUSTOM("Custom",
            "${sharedHabitName}: ${customText}"), PERIODICALLY("Periodically", "${sharedHabitName}: ${customText}");

    public final String label;
    public final String template;

    NotificationType(String label, String subjectTemplate) {
        this.label = label;
        this.template = subjectTemplate;
    }
}
