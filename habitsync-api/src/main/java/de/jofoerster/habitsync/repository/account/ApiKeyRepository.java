package de.jofoerster.habitsync.repository.account;

import de.jofoerster.habitsync.model.account.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
}
