package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Builder
@Data
public class ServerInfoReadDTO {
    private String serverVersion;
    private String minimalAppVersion;
    private String serverTime;
}
