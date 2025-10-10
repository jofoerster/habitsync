package de.jofoerster.habitsync.service.auth;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.account.ApiKey;
import de.jofoerster.habitsync.repository.account.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Generates a new API key for the given account
     * @return The plain API key (only returned once, should be stored by the user)
     */
    public String createApiKey(Account account, Set<String> authorities) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String plainApiKey = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        ApiKey apiKey = new ApiKey();
        apiKey.setAccount(account);
        apiKey.setHashedKey(passwordEncoder.encode(plainApiKey));
        apiKey.setAuthorities(authorities != null ? authorities : Set.of("ROLE_USER"));

        apiKeyRepository.save(apiKey);

        return plainApiKey;
    }

    public void revokeApiKeys(Account account) {
        apiKeyRepository.deleteApiKeyByAccount(account);
    }

    /**
     * Validates an API key and returns the associated ApiKey entity if valid
     */
    public Optional<ApiKey> validateApiKey(String plainApiKey) {
        if (plainApiKey == null || plainApiKey.isEmpty()) {
            return Optional.empty();
        }

        //TODO add caching here
        return apiKeyRepository.findAll().stream()
                .filter(apiKey -> passwordEncoder.matches(plainApiKey, apiKey.getHashedKey()))
                .findFirst();
    }
}

