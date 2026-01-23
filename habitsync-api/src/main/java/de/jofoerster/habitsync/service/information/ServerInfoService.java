package de.jofoerster.habitsync.service.information;

import de.jofoerster.habitsync.dto.ServerInfoReadDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Service
public class ServerInfoService {

    // Minimal required app version that can connect to this server
    private static final String MINIMAL_APP_VERSION = "0.18.0";

    @Value("${application.version:unknown}")
    private String serverVersion;

    public ServerInfoReadDTO getServerInfoDTO() {
        return ServerInfoReadDTO.builder()
                .serverVersion(serverVersion)
                .minimalAppVersion(MINIMAL_APP_VERSION)
                .serverTime(LocalDateTime.now().toString())
                .build();
    }
}
