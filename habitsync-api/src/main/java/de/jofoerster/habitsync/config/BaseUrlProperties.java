package de.jofoerster.habitsync.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * Configuration properties for the base URL.
 * Validates that the BASE_URL environment variable is a valid URL on startup.
 */
@Slf4j
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "base")
public class BaseUrlProperties {

    private static final String URL_EXAMPLES =
            "Example: BASE_URL=https://habitsync.example.com or BASE_URL=http://localhost:6842";

    private String url;

    @PostConstruct
    public void validateBaseUrl() {
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "BASE_URL is not configured. " +
                            "Please set the BASE_URL environment variable to the full URL where HabitSync is accessible, " +
                            "including the protocol (http:// or https://). " + URL_EXAMPLES);
        }

        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new IllegalStateException(
                        "BASE_URL '" + url + "' has an invalid or missing protocol. " +
                                "The BASE_URL must start with http:// or https://. " + URL_EXAMPLES);
            }
        } catch (URISyntaxException e) {
            throw new IllegalStateException(
                    "BASE_URL '" + url + "' is not a valid URL. " +
                            "This is required for JWT token issuer validation to work correctly. " + URL_EXAMPLES, e);
        }

        if (url.endsWith("/")) {
            log.warn("BASE_URL '{}' has a trailing slash. Consider removing it to avoid potential issues.", url);
        }

        log.info("BASE_URL configured as: {}", url);
    }
}



