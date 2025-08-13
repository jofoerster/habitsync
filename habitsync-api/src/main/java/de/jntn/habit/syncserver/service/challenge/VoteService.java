package de.jntn.habit.syncserver.service.challenge;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.challenge.Challenge;
import de.jntn.habit.syncserver.model.challenge.Vote;
import de.jntn.habit.syncserver.repository.challenge.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class VoteService {
    private final VoteRepository voteRepository;

    public List<Vote> getVotesByChallenge(Challenge challenge) {
        return voteRepository.getVotesByChallenge(challenge);
    }

    public int getVoteCountByChallenge(Challenge challenge) {
        List<Vote> getVotesByChallenge = getVotesByChallenge(challenge);
        return getVotesByChallenge.stream()
                .mapToInt(Vote::getVoteValue)
                .sum();
    }

    public Vote createOrUpdateVote(Account account, Challenge challenge, int voteValue) {
        Optional<Vote> voteOpt = voteRepository.getVoteByChallengeAndAccount(challenge, account);
        Vote vote = voteOpt.orElseGet(() -> createVote(account, challenge));
        vote.setVoteValue(voteValue);
        return voteRepository.save(vote);
    }

    public Map<Challenge, Integer> getVotesForChallenges(List<Challenge> challenges, Account account) {
        Map<Challenge, Integer> voteMap = new HashMap<>();
        challenges.forEach(challenge -> {
            Optional<Vote> voteOpt = voteRepository.getVoteByChallengeAndAccount(challenge, account);
            if (voteOpt.isPresent()) {
                voteMap.put(challenge, voteOpt.get()
                        .getVoteValue());
            } else {
                voteMap.put(challenge, 0);
            }
        });
        return voteMap;
    }

    private Vote createVote(Account account, Challenge challenge) {
        Vote vote = new Vote();
        vote.setAccount(account);
        vote.setChallenge(challenge);
        return vote;
    }

    public void deleteVotes(List<Vote> votes) {
        voteRepository.deleteAll(votes);
    }

    public Boolean getVoteByChallengeAndUser(Challenge challenge, Account account) {
        Optional<Vote> voteOpt = voteRepository.getVoteByChallengeAndAccount(challenge, account);
        return voteOpt.map(vote -> vote.getVoteValue() > 0).orElse(null);
    }
}
