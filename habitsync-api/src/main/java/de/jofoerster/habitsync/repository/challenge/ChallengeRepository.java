package de.jofoerster.habitsync.repository.challenge;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.challenge.Challenge;
import de.jofoerster.habitsync.model.challenge.ChallengeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    List<Challenge> findAllByStatus(ChallengeStatus status);

    List<Challenge> findAllByCreatorAndStatus(Account creator, ChallengeStatus status);

    List<Challenge> findAllByStatusIn(Collection<ChallengeStatus> statuses);
}
