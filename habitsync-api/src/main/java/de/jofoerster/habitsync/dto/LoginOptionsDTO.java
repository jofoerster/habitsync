package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class LoginOptionsDTO {
    List<SupportedIssuerDTO> supportedIssuers;
    boolean allowBasicAuth = false;
    String loginScreenText;
}
