package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.AccountReadDTO;
import de.jofoerster.habitsync.dto.AccountSettingsReadWriteDTO;
import de.jofoerster.habitsync.dto.HabitReadDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.auth.ApiKeyService;
import de.jofoerster.habitsync.service.auth.TokenService;
import de.jofoerster.habitsync.service.habit.HabitParticipationService;
import de.jofoerster.habitsync.service.habit.HabitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/user")
@Tag(name = "User Account", description = "User account management endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class AccountController {

    private final AccountService accountService;
    private final TokenService tokenService;
    private final HabitParticipationService habitParticipationService;
    private final HabitService habitService;
    private final ApiKeyService apiKeyService;

    public AccountController(AccountService accountService, TokenService tokenService,
                             HabitParticipationService habitParticipationService, HabitService habitService,
                             ApiKeyService apiKeyService) {
        this.accountService = accountService;
        this.tokenService = tokenService;
        this.habitParticipationService = habitParticipationService;
        this.habitService = habitService;
        this.apiKeyService = apiKeyService;
    }

    @Operation(
            summary = "Get current user information",
            description = "Returns the account information of the currently authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user information"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/info")
    public ResponseEntity<AccountReadDTO> getUserInfo() {
        return ResponseEntity.ok(accountService.getCurrentAccount().getApiAccountRead());
    }

    @Operation(
            summary = "Get user settings",
            description = "Returns the profile settings of the currently authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user settings"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/settings")
    public ResponseEntity<AccountSettingsReadWriteDTO> getUserSettings() {
        return ResponseEntity.ok(accountService.getProfileSettings());
    }

    @Operation(
            summary = "Update user settings",
            description = "Updates the profile settings of the currently authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated user settings"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @PutMapping("/settings")
    public ResponseEntity<AccountSettingsReadWriteDTO> updateUserSettings(
            @RequestBody AccountSettingsReadWriteDTO settings) {
        return ResponseEntity.ok(accountService.updateProfileSettings(settings));
    }

    @Operation(
            summary = "Get unapproved accounts",
            description = "Returns a list of user accounts that are pending approval. Only available to admin users."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved unapproved accounts"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - admin privileges required")
    })
    @GetMapping("/unapproved-accounts")
    public ResponseEntity<List<AccountReadDTO>> getUnapprovedAccounts() {
        return ResponseEntity.ok(
                accountService.getUnapprovedAccounts().stream().map(Account::getApiAccountRead).toList());
    }

    @Operation(
            summary = "Approve user account",
            description = "Approves a pending user account by UUID. Only available to admin users."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully approved account"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - admin privileges required"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    @PutMapping("/approve-account/{accountUuid}")
    public ResponseEntity<Void> approveAccount(@PathVariable String accountUuid) {
        accountService.approveAccount(accountUuid);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Get pending habit participation invitations",
            description = "Returns a list of habits where the current user has pending participation invitations."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved invitations"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/invitations/habit-participation/list")
    public ResponseEntity<List<HabitReadDTO>> getPendingHabitParticipationInvitations() {
        Account account = accountService.getCurrentAccount();
        return ResponseEntity.ok(
                habitParticipationService.getPendingHabitParticipationInvitations(account.getAuthenticationId())
                        .stream()
                        .map(h -> habitService.getHabitByUuid(h)
                                .orElseThrow())
                        .map(habitService::getApiHabitReadFromHabit)
                        .toList());
    }

    @Operation(
            summary = "Create new API key",
            description = "Generates a new API key for the current user. Any existing API keys will be revoked."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully created API key"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/api-key")
    public String createNewApiKey() {
        return apiKeyService.createApiKey(accountService.getCurrentAccount(), Set.of("ROLE_USER"));
    }

    @Operation(
            summary = "Revoke API key",
            description = "Revokes all API keys for the current user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully revoked API keys"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @DeleteMapping("/api-key")
    public ResponseEntity<Void> revokeApiKey() {
        apiKeyService.revokeApiKeys(accountService.getCurrentAccount());
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Get refresh token",
            description = "Returns a new access and refresh token pair for the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved tokens"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/refresh-token")
    public Map<String, String> refreshTokenGet() {
        return tokenService.createTokenPair(accountService.getAuthenticationIdWithoutCreatingUser());
    }
}
