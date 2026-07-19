package de.jofoerster.habitsync.service.wasm.events;

import de.jofoerster.habitsync.dto.HabitReadDTO;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class HabitEvent extends CloudEvent {
    private final HabitEventData data;

    public static class HabitEventData {
        HabitReadDTO before;
        HabitReadDTO after;
    }
}
