package de.jofoerster.habitsync.config;

import de.jofoerster.habitsync.dto.SupportedIssuerDTO;
import de.jofoerster.habitsync.dto.LoginOptionsDTO;
import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ConfigurationProperties(prefix = "app.security")
@Component
@Data
public class SecurityProperties {

    private Map<String, String> basicAuthUsers;

    @Value("${login-screen.text:}")
    private String loginScreenText;

    @Getter
    private Map<String, IssuerConfig> issuers = new HashMap<>();

    public List<String> getAllowedIssuers() {
        return issuers.values().stream()
                .map(IssuerConfig::getUrl)
                .toList();
    }

    public LoginOptionsDTO getDTO() {
        LoginOptionsDTO loginOptionsDTO = LoginOptionsDTO.builder()
                .supportedIssuers(
                        issuers.entrySet().stream()
                                .map(entry -> SupportedIssuerDTO.builder()
                                        .name(entry.getKey())
                                        .url(entry.getValue().getUrl())
                                        .clientId(entry.getValue().getClientId())
                                        .clientSecret(entry.getValue().getClientSecret())
                                        .scopes(entry.getValue().getScopes())
                                        .build())
                                .toList()
                )
                .allowBasicAuth(basicAuthUsers != null && !basicAuthUsers.isEmpty())
                .loginScreenText(loginScreenText)
                .build();
        log.info("Returning supported issuers: {}", loginOptionsDTO);
        return loginOptionsDTO;
    }


    @Data
    public static class IssuerConfig {
        private String url;
        private String clientId;
        private String clientSecret;
        private List<String> scopes;
        private boolean needsConfirmation = true;
    }
}
