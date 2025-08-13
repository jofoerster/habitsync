package de.jntn.habit.syncserver.controller;

import de.jntn.habit.syncserver.dto.AccountReadDTO;
import de.jntn.habit.syncserver.dto.AccountSettingsReadWriteDTO;
import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.service.account.AccountService;
import de.jntn.habit.syncserver.service.auth.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class AccountController {

    private final AccountService accountService;
    private final TokenService tokenService;

    public AccountController(AccountService accountService, TokenService tokenService) {
        this.accountService = accountService;
        this.tokenService = tokenService;
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

    @GetMapping("/refresh-token")
    public Map<String, String> refreshTokenGet() {
        return tokenService.createTokenPair(accountService.getCurrentAccount().getAuthenticationId());
    }
}
