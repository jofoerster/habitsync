package de.jofoerster.habitsync.service.configuration;

import de.jofoerster.habitsync.dto.ConfigReadDTO;
import de.jofoerster.habitsync.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class ConfigurationService {

    private final NotificationService notificationService;

    @Value("${hide-challenges:false}")
    private Boolean hideChallenges;

    @Value("${tracker.dateformat.template:DD.MM.}")
    private String templateDateFormat;

    public ConfigReadDTO getConfiguration() {
        return ConfigReadDTO.builder()
                .appriseActive(notificationService.isAppriseActive())
                .hideChallenges(hideChallenges)
                .templateDateFormat(templateDateFormat)
                .build();
    }
}
