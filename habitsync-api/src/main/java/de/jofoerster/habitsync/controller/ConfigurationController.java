package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.ConfigReadDTO;
import de.jofoerster.habitsync.service.configuration.ConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigurationController {

    private final ConfigurationService configurationService;

    @GetMapping
    public ResponseEntity<ConfigReadDTO> getConfiguration() {
        return ResponseEntity.ok(configurationService.getConfiguration());
    }
}
