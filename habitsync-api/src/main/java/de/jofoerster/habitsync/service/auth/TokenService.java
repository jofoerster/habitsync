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
        return createTokenPair(userId, Map.of());
    }

    public Map<String, String> createTokenPair(String userId, Map<String, String> additionalClaims) {
        String accessToken = this.createToken(userId, "access", 15 * 60 * 1000, additionalClaims);
        String refreshToken = this.createToken(userId, "refresh", 30L * 24 * 60 * 60 * 1000, additionalClaims);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
        );
    }

    public String createToken(String userId, String type, long durationMs) {
        return createToken(userId, type, durationMs, Map.of());
    }

    public String createToken(String userId, String type, long durationMs, Map<String, String> additionalClaims) {
        var builder = Jwts.builder()
                .subject(userId)
                .issuer(baseUrl)
                .expiration(new Date(System.currentTimeMillis() + durationMs))
                .claim("type", type);

        additionalClaims.forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                builder.claim(key, value);
            }
        });

        return builder.signWith(secretKey).compact();
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

    public Map<String, String> getClaimsFromOwnToken(String token) {
        Jws<Claims> claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
        Claims payload = claims.getPayload();
        Map<String, String> result = new java.util.HashMap<>();
        for (String key : List.of("email", "name", "preferred_username", "original_issuer")) {
            String value = payload.get(key, String.class);
            if (value != null) {
                result.put(key, value);
            }
        }
        return result;
    }

    public JwtDecoder getCustomJwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    public boolean checkIfNeedsConfirmation(JwtAuthenticationToken jwtAuth) {
        String tokenIssuer = jwtAuth.getToken().getIssuer() != null ? jwtAuth.getToken().getIssuer().toString() : null;

        String issuer;
        if (tokenIssuer != null && tokenIssuer.equals(baseUrl)) {
            String originalIssuer = jwtAuth.getToken().getClaimAsString("original_issuer");
            if (originalIssuer != null && !originalIssuer.isEmpty()) {
                issuer = originalIssuer;
            } else {
                return false;
            }
        } else {
            issuer = tokenIssuer;
        }

        List<String> issuerUrls = securityProperties.getIssuers().values().stream()
                .map(SecurityProperties.IssuerConfig::getUrl).toList();
        if (issuer == null || (!issuerUrls.contains(issuer))) {
            return false;
        }

        SecurityProperties.IssuerConfig config = securityProperties.getIssuers().values().stream()
                .filter(i -> i.getUrl().equals(issuer))
                .findFirst()
                .orElse(null);

        return config == null || config.isNeedsConfirmation();
    }

    /**
     * Validates an external OAuth access token and returns the decoded JWT.
     * @param accessToken The external OAuth access token
     * @return The decoded JWT, or null if invalid
     */
    public Jwt validateExternalToken(String accessToken) {
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
                    return jwt;
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