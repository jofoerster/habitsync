package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.LoginOptionsDTO;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.auth.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.web.servlet.view.RedirectView;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public authentication endpoints - no authentication required")
public class AuthController {

    private final AccountService accountService;
    private final TokenService tokenService;

    @Operation(
            summary = "Get available login options",
            description = "Returns the available authentication methods configured on the server. This endpoint is public."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved login options")
    })
    @GetMapping("/login-options")
    public ResponseEntity<LoginOptionsDTO> getLoginOptions() {
        LoginOptionsDTO loginOptionsDTO = accountService.getLoginOptions();
        return ResponseEntity.ok(loginOptionsDTO);
    }

    @Operation(
            summary = "Get authentication status",
            description = "Returns the current authentication status including user information if authenticated. This endpoint is public but returns different data based on authentication state."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved authentication status")
    })
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

    @Operation(
            summary = "Refresh authentication tokens",
            description = "Exchange a valid refresh token for a new access token and refresh token pair. This endpoint is public."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully refreshed tokens"),
            @ApiResponse(responseCode = "401", description = "Invalid refresh token")
    })
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