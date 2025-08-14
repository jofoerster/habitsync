package de.jofoerster.habitsync.service.auth;

import de.jofoerster.habitsync.config.SecurityProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
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
        } catch (JwtException | IllegalArgumentException e) {
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
        if (issuer == null || !securityProperties.getIssuers().containsKey(issuer)) {
            return false;
        }
        return securityProperties.getIssuers().get(issuer).isNeedsConfirmation();
    }
}