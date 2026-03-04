package de.jofoerster.habitsync.service.auth;

import de.jofoerster.habitsync.config.SecurityProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class TokenService {

    @Value("${base.url}")
    String baseUrl;

    private final SecretKey secretKey;

    private final SecurityProperties securityProperties;

    public TokenService(SecurityProperties securityProperties, @Value("${jwt.secret:#{null}}") String jwtSecret) {
        this.securityProperties = securityProperties;
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            this.secretKey = Jwts.SIG.HS512.key().build();
        } else {
            this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        }
    }

    public Map<String, String> createTokenPair(String userId) {
        String accessToken = this.createToken(userId, "access", 15 * 60 * 1000);
        String refreshToken = this.createToken(userId, "refresh", 30L * 24 * 60 * 60 * 1000);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
        );
    }

    public String createToken(String userId, String type, long durationMs) {
        return Jwts.builder()
                .subject(userId)
                .issuer(baseUrl)
                .expiration(new Date(System.currentTimeMillis() + durationMs))
                .claim("type", type)
                .signWith(secretKey)
                .compact();
    }

    public boolean isOwnTokenValid(String token, String expectedType) {
        try {
            Jws<Claims> claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            String tokenType = claims.getPayload().get("type", String.class);
            return expectedType.equals(tokenType) && claims.getPayload().getExpiration().after(new Date());
        } catch (ExpiredJwtException | JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isPublicIssuerJwtTokenValid(JwtAuthenticationToken jwtAuth) {
        Jwt jwt = jwtAuth.getToken();
        String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : null;

        if (issuer == null || !securityProperties.getAllowedIssuers().contains(issuer)) {
            return false;
        }

        return true;
    }

    public String getUserIdFromToken(String token) {
        Jws<Claims> claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
        return claims.getPayload().getSubject();
    }

    public JwtDecoder getCustomJwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    public boolean checkIfNeedsConfirmation(JwtAuthenticationToken jwtAuth) {
        String issuer = jwtAuth.getToken().getIssuer() != null ? jwtAuth.getToken().getIssuer().toString() : null;
        List issuerUrls = securityProperties.getIssuers().values().stream().map(SecurityProperties.IssuerConfig::getUrl).toList();
        if (issuer == null || (!securityProperties.getIssuers().containsKey(issuer) && !issuerUrls.contains(issuer)) || issuer.equals(baseUrl)) {
            return false;
        }
        SecurityProperties.IssuerConfig config = securityProperties.getIssuers().get(issuer);
        if (config != null) {
            return config.isNeedsConfirmation();
        } else {
            config = securityProperties.getIssuers().values().stream().filter(i -> i.getUrl().equals(issuer)).findFirst().get();
        }
        return config == null || config.isNeedsConfirmation();
    }

    /**
     * Validates an external OAuth access token and extracts the user ID (subject).
     * @param accessToken The external OAuth access token
     * @return The user ID (subject) from the token, or null if invalid
     */
    public String validateExternalTokenAndGetUserId(String accessToken) {
        if (accessToken == null || accessToken.isEmpty()) {
            return null;
        }

        // Try to decode with each configured issuer's decoder
        for (SecurityProperties.IssuerConfig issuerConfig : securityProperties.getIssuers().values()) {
            try {
                JwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuerConfig.getUrl());
                Jwt jwt = decoder.decode(accessToken);

                // Verify the issuer matches
                String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : null;
                if (issuer != null && securityProperties.getAllowedIssuers().contains(issuer)) {
                    return jwt.getSubject();
                }
            } catch (JwtException e) {
                // Token not valid for this issuer, try next
                log.debug("Token validation failed for issuer {}: {}", issuerConfig.getUrl(), e.getMessage());
            }
        }

        return null;
    }

    /**
     * Validates username/password credentials against configured basic auth users.
     * @param username The username
     * @param password The password (plain text)
     * @return The username if valid, or null if invalid
     */
    public String validateUsernamePasswordAndGetUserId(String username, String password) {
        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            return null;
        }

        Map<String, String> basicAuthUsers = securityProperties.getBasicAuthUsers();
        if (basicAuthUsers == null || !basicAuthUsers.containsKey(username)) {
            return null;
        }

        String storedBcryptHash = basicAuthUsers.get(username);
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        if (encoder.matches(password, storedBcryptHash)) {
            return username;
        }

        return null;
    }
}