package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.AccountReadDTO;
import de.jofoerster.habitsync.dto.AccountSettingsReadWriteDTO;
import de.jofoerster.habitsync.dto.HabitReadDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.auth.TokenService;
import de.jofoerster.habitsync.service.habit.HabitParticipationService;
import de.jofoerster.habitsync.service.habit.HabitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class AccountController {

    private final AccountService accountService;
    private final TokenService tokenService;
    private final HabitParticipationService habitParticipationService;
    private final HabitService habitService;

    public AccountController(AccountService accountService, TokenService tokenService,
                             HabitParticipationService habitParticipationService, HabitService habitService) {
        this.accountService = accountService;
        this.tokenService = tokenService;
        this.habitParticipationService = habitParticipationService;
        this.habitService = habitService;
    }

    @GetMapping("/info")
    public ResponseEntity<AccountReadDTO> getUserInfo() {
        return ResponseEntity.ok(accountService.getCurrentAccount().getApiAccountRead());
    }

    @GetMapping("/settings")
    public ResponseEntity<AccountSettingsReadWriteDTO> getUserSettings() {
        return ResponseEntity.ok(accountService.getProfileSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<AccountSettingsReadWriteDTO> updateUserSettings(
            @RequestBody AccountSettingsReadWriteDTO settings) {
        return ResponseEntity.ok(accountService.updateProfileSettings(settings));
    }

    @GetMapping("/unapproved-accounts")
    public ResponseEntity<List<AccountReadDTO>> getUnapprovedAccounts() {
        return ResponseEntity.ok(
                accountService.getUnapprovedAccounts().stream().map(Account::getApiAccountRead).toList());
    }

    @PutMapping("/approve-account/{accountUuid}")
    public ResponseEntity<Void> approveAccount(@PathVariable String accountUuid) {
        accountService.approveAccount(accountUuid);
        return ResponseEntity.ok().build();
    }

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

    @GetMapping("/refresh-token")
    public Map<String, String> refreshTokenGet() {
        return tokenService.createTokenPair(accountService.getAuthenticationIdWithoutCreatingUser());
    }
}
