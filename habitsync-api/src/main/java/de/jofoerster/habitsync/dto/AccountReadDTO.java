package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountReadDTO {
    private String displayName;
    private String authenticationId;
    private String email;
}
