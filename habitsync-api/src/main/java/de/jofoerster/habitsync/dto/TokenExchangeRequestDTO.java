package de.jofoerster.habitsync.dto;

import lombok.Data;

/**
 * DTO for exchanging external credentials for internal JWT tokens.
 * Either accessToken OR (username AND password) must be provided.
 */
@Data
public class TokenExchangeRequestDTO {
    /**
     * External OAuth access token to exchange for internal tokens.
     */
    private String accessToken;

    /**
     * Username for basic authentication.
     */
    private String username;

    /**
     * Password for basic authentication.
     */
    private String password;
}

