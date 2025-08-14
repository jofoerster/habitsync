package de.jofoerster.habitsync.config;

import de.jofoerster.habitsync.dto.SupportedIssuerDTO;
import de.jofoerster.habitsync.dto.SupportedIssuersDTO;
import lombok.Data;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ConfigurationProperties(prefix = "app.security")
@Component
@Data
public class SecurityProperties {

    private List<String> basicAuthUsers;

    @Getter
    private Map<String, IssuerConfig> issuers = new HashMap<>();

    public List<String> getAllowedIssuers() {
        return issuers.values().stream()
                .map(IssuerConfig::getUrl)
                .toList();
    }

    public Map<String, String> getBasicAuthUsers() {
        if (basicAuthUsers == null || basicAuthUsers.isEmpty()) {
            return Map.of();
        }
        return basicAuthUsers.stream()
                .collect(HashMap::new, (map, user) -> {
                    String[] parts = user.split(":");
                    if (parts.length == 2) {
                        map.put(parts[0], parts[1]);
                    }
                }, HashMap::putAll);
    }

    public SupportedIssuersDTO getDTO() {
        return SupportedIssuersDTO.builder()
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
                .build();
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
