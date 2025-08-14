package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class SupportedIssuerDTO {
    private String name;
    private String url;
    private String clientId;
    private String clientSecret;
    private List<String> scopes;
}
