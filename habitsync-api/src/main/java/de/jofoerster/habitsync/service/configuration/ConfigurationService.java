package de.jofoerster.habitsync.service.configuration;

import de.jofoerster.habitsync.dto.ConfigReadDTO;
import de.jofoerster.habitsync.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class ConfigurationService {

    private final NotificationService notificationService;

    public ConfigReadDTO getConfiguration() {
        return ConfigReadDTO.builder()
                .appriseActive(notificationService.isAppriseActive())
                .build();
    }
}
