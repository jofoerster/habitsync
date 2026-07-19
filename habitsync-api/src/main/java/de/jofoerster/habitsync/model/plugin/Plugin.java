package de.jofoerster.habitsync.model.plugin;

import de.jofoerster.habitsync.service.wasm.events.EventType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Plugin {
    @Id
    private UUID uuid;
    @Enumerated(EnumType.STRING)
    private EventType eventType;
    private String subjectUuid;
    private String fileName;
    private boolean isActive;
}
