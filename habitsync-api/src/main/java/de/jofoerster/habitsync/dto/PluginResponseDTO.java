package de.jofoerster.habitsync.dto;

import de.jofoerster.habitsync.service.wasm.events.EventType;

import java.util.UUID;

public record PluginResponseDTO(
        UUID id,
        EventType eventType,
        String subjectUuid,
        String filename,
        boolean isActive
) {
}