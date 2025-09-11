package de.jofoerster.habitsync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class NotificationConfigDTO {
    private String appriseTarget; // optional, only for custom target
    private List<NotificationConfigRuleDTO> rules;
}

