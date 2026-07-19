package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.PluginResponseDTO;
import de.jofoerster.habitsync.service.wasm.PluginService;
import de.jofoerster.habitsync.service.wasm.events.EventType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/plugins")
public class PluginController {

    private final PluginService pluginService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PluginResponseDTO> uploadAndSetupPlugin(
            @RequestParam("eventType") EventType eventType,
            @RequestParam("subjectUuid") String subjectUuid,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty() || !Objects.requireNonNull(file.getOriginalFilename()).endsWith(".wasm")) {
            return ResponseEntity.badRequest().build();
        }

        PluginResponseDTO createdPlugin = pluginService.installPlugin(eventType, subjectUuid, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlugin);
    }

    @GetMapping
    public ResponseEntity<List<PluginResponseDTO>> getAllPlugins() {
        return ResponseEntity.ok(pluginService.getAllPlugins());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlugin(@PathVariable UUID id) {
        pluginService.deletePlugin(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<PluginResponseDTO> togglePluginStatus(
            @PathVariable UUID id,
            @RequestParam("isActive") boolean isActive) {

        PluginResponseDTO updatedPlugin = pluginService.updateStatus(id, isActive);
        return ResponseEntity.ok(updatedPlugin);
    }
}