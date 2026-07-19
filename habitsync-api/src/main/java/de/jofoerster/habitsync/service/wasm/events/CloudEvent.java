package de.jofoerster.habitsync.service.wasm.events;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CloudEvent {
    private final String id;
    private final EventType type;
    private final String time;
    private final String subject;
    private final String habitsyncApiKey;
}
