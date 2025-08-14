package de.jofoerster.habitsync.repository.challenge;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.challenge.Challenge;
import de.jofoerster.habitsync.model.challenge.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> getVotesByChallenge(Challenge challenge);

    Optional<Vote> getVoteByChallengeAndAccount(Challenge challenge, Account account);

    List<Account> getVotesByAccount(Account account);
}
