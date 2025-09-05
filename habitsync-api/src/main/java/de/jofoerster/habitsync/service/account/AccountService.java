package de.jofoerster.habitsync.service.account;

import de.jofoerster.habitsync.config.SecurityProperties;
import de.jofoerster.habitsync.dto.AccountSettingsReadWriteDTO;
import de.jofoerster.habitsync.dto.SupportedIssuersDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.account.AccountStatus;
import de.jofoerster.habitsync.repository.account.AccountRepository;
import de.jofoerster.habitsync.service.auth.TokenService;
import de.jofoerster.habitsync.service.notification.NotificationService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final NotificationService notificationService;
    private final Environment environment;
    private final SecurityProperties securityProperties;
    private final TokenService tokenService;

//    Currently not needed
//    @PostConstruct
//    public void init() {
//        log.info("Initializing account service, scheduling user notification jobs");
//        List<Account> accounts = accountRepository.getAccountsBySendNotificationsViaEmail(true);
//        accounts.forEach(notificationService::scheduleNotificationJob);
//    }

    public boolean isUserAllowed(Authentication authentication) {
        log.debug("Checking user authorization");
        if (authentication.getPrincipal() == null || authentication instanceof AnonymousAuthenticationToken) {
            log.debug("User is not authenticated");
            return false;
        }

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String subject = jwt.getSubject();

            if (!tokenService.isPublicIssuerJwtTokenValid(jwtAuth) &&
                    !tokenService.isOwnTokenValid(jwt.getTokenValue(), "access")) {
                return false;
            }

            return getOrCreateAccountById(subject, jwtAuth).getAccountStatus() == AccountStatus.ACTIVE;
        }

        if (authentication instanceof UsernamePasswordAuthenticationToken) {
            return true; // Allow username/password authentication without additional checks
        }

        log.debug("Authentication type not supported: {}", authentication.getClass().getSimpleName());
        return false;
    }

    public Account getOrCreateAccountById(String id) {
        return accountRepository.getAccountByAuthenticationId(id)
                .orElseGet(this::createAccount);
    }

    public Account getOrCreateAccountById(String id, JwtAuthenticationToken jwtAuth) {
        return accountRepository.getAccountByAuthenticationId(id)
                .orElseGet(() -> this.createAccount(jwtAuth));
    }

    public Account getCurrentAccount() {
        return getOrCreateAccountById(getCurrentAccountId());
    }

    private String getCurrentAccountId() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return jwt.getSubject();
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {
            return authentication.getName();
        } else if (Arrays.asList(environment.getActiveProfiles())
                .contains("test")) {
            return authentication.getName();
        }

        throw new IllegalStateException("User is not authenticated");
    }

    private String getCurrentAccountUsername() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String name = jwt.getClaimAsString("name");
            String preferredUsername = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");

            if (name != null && !name.trim().isEmpty()) {
                return name;
            } else if (preferredUsername != null && !preferredUsername.trim().isEmpty()) {
                return preferredUsername;
            } else if (email != null && !email.trim().isEmpty()) {
                return email;
            } else {
                return jwt.getSubject();
            }
        }

        return authentication.getName();
    }

    public String getEmail() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return jwt.getClaimAsString("email");
        }

        // For username/password authentication, we might not have email in the token
        // This could be enhanced to fetch from user details or database
        return "";
    }

    private Account createAccount(JwtAuthenticationToken jwtAuth) {
        return createAccount(tokenService.checkIfNeedsConfirmation(jwtAuth));
    }

    private Account createAccount() {
        return createAccount(true);
    };

    private Account createAccount(boolean needsConfirmation) {
        log.info("Creating account {}", getCurrentAccountUsername());
        Account account = new Account();
        account.setAuthenticationId(getCurrentAccountId());
        account.setUserName(getCurrentAccountUsername());
        account.setEmail(getEmail());
        account.setAccountStatus(needsConfirmation ? AccountStatus.AWAITING_APPROVAL : AccountStatus.ACTIVE);
        return updateAccount(account);
    }

    public Account updateAccount(Account account) {
        log.info("Updating account {}", getCurrentAccountUsername());
        if (account.isSendNotificationsViaEmail()) {
            log.info("Scheduling notification job for account {}", account.getAuthenticationId());
            notificationService.scheduleNotificationJob(account);
        } else {
            log.info("Removing notification job for account {}", account.getAuthenticationId());
            notificationService.removeNotificationJob(account);
        }
        return accountRepository.save(account);
    }

    public List<Account> getUnapprovedAccounts() {
        return accountRepository.getAccountsByAccountStatus(AccountStatus.AWAITING_APPROVAL);
    }

    public void approveAccount(String userId) {
        log.info("Approving account {}", userId);
        Account account = accountRepository.getAccountByAuthenticationId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + userId));
        if (account.getAccountStatus() != AccountStatus.AWAITING_APPROVAL) {
            throw new IllegalStateException("Account is not AWAITING_APPROVAL");
        } else {
            account.setAccountStatus(AccountStatus.ACTIVE);
            accountRepository.save(account);
        }
    }

    public AccountSettingsReadWriteDTO getProfileSettings() {
        Account account = getCurrentAccount();
        return getProfileSettings(account);
    }

    public AccountSettingsReadWriteDTO getProfileSettings(Account account) {
        return AccountSettingsReadWriteDTO.builder()
                .displayName(account.getDisplayName())
                .email(account.getEmail())
                .authenticationId(account.getAuthenticationId())
                .isEmailNotificationsEnabled(account.isSendNotificationsViaEmail())
                .isPushNotificationsEnabled(false) // Push notifications not implemented
                .dailyNotificationHour(account.getNotificationCreationHour())
                .build();
    }

    public AccountSettingsReadWriteDTO updateProfileSettings(AccountSettingsReadWriteDTO settings) {
        Account account = getCurrentAccount();
        account.setDisplayName(settings.getDisplayName());
        account.setEmail(settings.getEmail());
        account.setSendNotificationsViaEmail(
                settings.getIsEmailNotificationsEnabled() == null || settings.getIsEmailNotificationsEnabled());
        account.setNotificationCreationHour(settings.getDailyNotificationHour());
        account.setEnableInternalHabitTracker(true); // legacy feature, always enabled
        account = updateAccount(account);
        return this.getProfileSettings(account);
    }

    public SupportedIssuersDTO getSupportedIssuers() {
        log.info("Getting supported issuers");
        return securityProperties.getDTO();
    }

    public String getAuthenticationIdWithoutCreatingUser() {
        return getCurrentAccountId();
    }
}
