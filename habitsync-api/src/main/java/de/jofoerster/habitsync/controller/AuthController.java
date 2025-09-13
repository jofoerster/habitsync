package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.LoginOptionsDTO;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.auth.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AccountService accountService;
    private final TokenService tokenService;

    @GetMapping("/login-options")
    public ResponseEntity<LoginOptionsDTO> getLoginOptions() {
        LoginOptionsDTO loginOptionsDTO = accountService.getLoginOptions();
        return ResponseEntity.ok(loginOptionsDTO);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAuthStatus(
            Authentication authentication,
            @AuthenticationPrincipal Object principal) {

        Map<String, Object> status = new HashMap<>();

        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {

            boolean isApproved = accountService.isUserAllowed(authentication);

            status.put("authenticated", true);
            status.put("approved", isApproved);

            Map<String, Object> userInfo = new HashMap<>();

            if (authentication instanceof JwtAuthenticationToken jwtAuth) {
                Jwt jwt = jwtAuth.getToken();
                userInfo.put("sub", jwt.getSubject());
                userInfo.put("name", jwt.getClaimAsString("name"));
                userInfo.put("email", jwt.getClaimAsString("email"));
                userInfo.put("preferred_username", jwt.getClaimAsString("preferred_username"));
                userInfo.put("issuer", jwt.getIssuer() != null ? jwt.getIssuer().toString() : null);
                userInfo.put("type", "jwt");
            } else if (principal instanceof UserDetails userDetails) {
                userInfo.put("username", userDetails.getUsername());
                userInfo.put("name", userDetails.getUsername());
                userInfo.put("authorities", userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList());
                userInfo.put("type", "form");
            } else {
                userInfo.put("name", authentication.getName());
                userInfo.put("type", "other");
            }

            status.put("user", userInfo);
        } else {
            status.put("authenticated", false);
            status.put("approved", false);
        }

        return ResponseEntity.ok(status);
    }

    @PostMapping("/refresh-token")
    public Map<String, String> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");

        if (refreshToken == null || !tokenService.isOwnTokenValid(refreshToken, "refresh")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        String userId = tokenService.getUserIdFromToken(refreshToken);
        return tokenService.createTokenPair(userId);
    }

}