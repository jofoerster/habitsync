package de.jofoerster.habitsync.service.wasm.events;

import de.jofoerster.habitsync.dto.HabitReadDTO;
import de.jofoerster.habitsync.dto.HabitRecordReadDTO;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class HabitRecordEvent extends CloudEvent {
    private final HabitRecordEventData data;

    public static class HabitRecordEventData {
        HabitRecordReadDTO before;
        HabitRecordReadDTO after;
        HabitReadDTO habitBefore;
        HabitReadDTO habitAfter;
    }
}
