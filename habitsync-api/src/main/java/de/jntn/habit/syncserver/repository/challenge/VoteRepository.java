package de.jntn.habit.syncserver.repository.challenge;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.challenge.Challenge;
import de.jntn.habit.syncserver.model.challenge.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> getVotesByChallenge(Challenge challenge);

    Optional<Vote> getVoteByChallengeAndAccount(Challenge challenge, Account account);

    List<Account> getVotesByAccount(Account account);
}
