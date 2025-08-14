package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class SupportedIssuersDTO {
    List<SupportedIssuerDTO> supportedIssuers;
    boolean allowBasicAuth = false;
}
