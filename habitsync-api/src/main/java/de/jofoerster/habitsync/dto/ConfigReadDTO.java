package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class ConfigReadDTO {
    private boolean isAppriseConfigured;
}
