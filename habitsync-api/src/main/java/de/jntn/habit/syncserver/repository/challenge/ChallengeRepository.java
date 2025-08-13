package de.jntn.habit.syncserver.repository.challenge;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.challenge.Challenge;
import de.jntn.habit.syncserver.model.challenge.ChallengeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    List<Challenge> findAllByStatus(ChallengeStatus status);

    List<Challenge> findAllByCreatorAndStatus(Account creator, ChallengeStatus status);

    List<Challenge> findAllByStatusIn(Collection<ChallengeStatus> statuses);
}
