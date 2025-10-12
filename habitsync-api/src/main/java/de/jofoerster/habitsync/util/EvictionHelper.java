package de.jofoerster.habitsync.util;

import de.jofoerster.habitsync.model.habit.Habit;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

public class EvictionHelper {

    public static LocalDate[] getCompletionEvictionTimeframe(Habit habit, LocalDate date) {
        LocalDate startDate;
        LocalDate endDate;
        switch (habit.getParsedFrequencyType()) {
            case MONTHLY -> {
                startDate = date.with(TemporalAdjusters.firstDayOfMonth());
                endDate = date.with(TemporalAdjusters.lastDayOfMonth());
            }
            case X_TIMES_PER_Y_DAYS -> {
                startDate = date.minusDays(habit.parseCustomFrequency()[1] - 1);
                endDate = date;
            }
            default-> { // always WEEKLY
                startDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                endDate = startDate.plusDays(6);
            }
        }
        return new LocalDate[]{startDate, endDate};
    }
}
