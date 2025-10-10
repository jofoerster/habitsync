package de.jofoerster.habitsync.service.challenge;

import de.jofoerster.habitsync.dto.*;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.challenge.*;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.repository.challenge.ChallengeRepository;
import de.jofoerster.habitsync.repository.challenge.ChallengeResultRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.service.habit.CachingHabitProgressService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
import de.jofoerster.habitsync.util.exceptions.ChallengeProposalFailedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static de.jofoerster.habitsync.util.Utils.ifNotNull;

@Slf4j
@RequiredArgsConstructor
@Service
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final HabitService habitService;
    private final HabitRecordRepository habitRecordRepository;
    private final VoteService voteService;
    private final ChallengeResultRepository challengeResultRepository;
    private final NotificationRuleService notificationRuleService;
    private final CachingHabitProgressService cachingHabitProgressService;

    private Map<Account, Integer> cachedLeaderboard = new HashMap<>();
    private LocalDate leaderboardLastUpdated = LocalDate.now()
            .minusDays(1);

    public void propose(Long challengeId, Account account) {
        Optional<Challenge> challengeOpt = challengeRepository.findById(challengeId);
        if (challengeOpt.isEmpty()) {
            throw new ChallengeProposalFailedException("Could not find challenge with id " + challengeId);
        }
        Challenge challenge = challengeOpt.get();
        if (!challenge.getCreator()
                .equals(account)) {
            throw new ChallengeProposalFailedException("Challenge creator does not match challenge creator");
        }
        checkChallengeConfiguration(challenge);
        challenge.setStatus(ChallengeStatus.PROPOSED);
        challengeRepository.save(challenge);
    }

    private void checkChallengeConfiguration(Challenge challenge) {
        if (challenge.getTitle() == null || challenge.getTitle().isEmpty()) {
            throw new ChallengeProposalFailedException("Challenge title is null or empty");
        }
        if (challenge.getComputationType() == null) {
            throw new ChallengeProposalFailedException("Challenge computationType is null");
        }
        if (challenge.getComputationType() == ChallengeComputationType.RELATIVE ||
                challenge.getComputationType() == ChallengeComputationType.ABSOLUTE) {
            if (challenge.getRule().getInternalHabitForComputationOfGoal().getDailyGoal() == null) {
                throw new ChallengeProposalFailedException("Daily goal is null");
            }
            if (challenge.getRule().getInternalHabitForComputationOfGoal().getFreqType() == null) {
                throw new ChallengeProposalFailedException("FreqType is null");
            }
            if (challenge.getRule().getInternalHabitForComputationOfGoal().getFreqType() < 3) {
                if (challenge.getRule().getInternalHabitForComputationOfGoal().getFreqCustom()
                        .split(",")[0].isEmpty()) {
                    throw new ChallengeProposalFailedException("Weekly/monthly frequency is configured incorrectly");
                }
            } else {
                if (challenge.getRule().getInternalHabitForComputationOfGoal().getFreqCustom().split(",").length != 2) {
                    throw new ChallengeProposalFailedException(
                            "For X times per Y days both X and Y have to be configured correctly");
                }
            }

        }
    }

    public Optional<Challenge> getChallengeById(long challengeId) {
        return challengeRepository.findById(challengeId);
    }

    public Map<Account, Integer> getLeaderboard() {
        if (leaderboardLastUpdated.getDayOfYear() == LocalDate.now()
                .getDayOfYear()) {
            return cachedLeaderboard;
        }
        Map<Account, Integer> leaderboard = new HashMap<>();

        List<ChallengeResult> challengeResults =
                challengeResultRepository.findAllByPlacementLessThanEqual(3);
        challengeResults.forEach(result -> leaderboard.put(result.getAccount(),
                leaderboard.getOrDefault(result.getAccount(), 0) + 4 - result.getPlacement()));

        Map<Account, Integer> sortedLeaderboard = leaderboard.entrySet().stream()
                .sorted(Map.Entry.<Account, Integer>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));

        this.cachedLeaderboard = sortedLeaderboard;
        this.leaderboardLastUpdated = LocalDate.now();
        return sortedLeaderboard;
    }

    public Challenge getCurrentlyActiveChallenge() {
        List<Challenge> challenges = challengeRepository.findAllByStatus(ChallengeStatus.ACTIVE);
        if (challenges.isEmpty()) {
            log.warn("No active challenge found");
            return null;
        } else if (challenges.size() == 1) {
            return challenges.getFirst();
        }
        throw new IllegalStateException("There is more than one active challenge");
    }

    public Map<Account, ChallengeProgress> getScoresOfAccountsOfCurrentlyActiveChallenge(HabitRecordSupplier recordSupplier) {
        Challenge challenge = getCurrentlyActiveChallenge();
        return getScoresOfAccounts(recordSupplier, challenge);
    }

    public Map<Account, ChallengeProgress> getScoresOfAccounts(HabitRecordSupplier recordSupplier, Challenge challenge) {
        Map<Account, ChallengeProgress> scores = new HashMap<>();
        List<Habit> habits = habitService.getChallengeHabits();
        if (challenge == null) {
            return scores;
        }
        scores = challenge.getProgressOfHabits(habits, recordSupplier, cachingHabitProgressService);
        scores.entrySet()
                .removeIf(e -> e.getValue()
                        .getPercentage() == 0.0);
        return scores;
    }

    public void saveAndCheckChallenge(Challenge challenge, Account account) {
        challenge.setCreator(account);
        challenge.setStatus(ChallengeStatus.CREATED);
        challenge.setStartDate(null);
        challenge.setEndDate(null);

        Habit habit = challenge.getRule().getInternalHabitForComputationOfGoal();

        if (habit.getDailyGoal() == null || habit.getDailyGoal() <= 0
                || habit.getFreqType() == null || habit.getFreqType() < 0 || challenge.getComputationType() == null) {
            throw new IllegalArgumentException("Configuration of challenge is not valid");
        }

        challengeRepository.save(challenge);
    }

    public void deleteChallenge(Challenge challenge) {
        List<Vote> votes = voteService.getVotesByChallenge(challenge);
        voteService.deleteVotes(votes);
        challengeRepository.delete(challenge);
    }

    public List<ChallengeReadDTO> getChallengeList(Account account) {
        List<Challenge> challenges = challengeRepository.findAllByStatusIn(
                List.of(ChallengeStatus.PROPOSED, ChallengeStatus.CREATED));
        return challenges.stream()
                .filter(c -> c.getStatus() != ChallengeStatus.CREATED ||
                        c.getCreator().equals(account))
                .map(c -> this.getApiChallengeRead(c, account)).toList();
    }

    public List<ChallengeReadDTO> getChallengeList(ChallengeStatus status, Account account, boolean filterByAccount) {
        List<Challenge> challenges = challengeRepository.findAllByStatus(status);
        if (filterByAccount) {
            challenges = challenges.stream()
                    .filter(c -> c.getCreator().equals(account))
                    .toList();
        }
        return challenges.stream()
                .map(c -> this.getApiChallengeRead(c, account)).toList();
    }

    public ChallengeReadDTO getApiChallengeRead(Challenge challenge, Account account) {
        return ChallengeReadDTO.builder()
                .id(challenge.getId())
                .account(challenge.getCreator().getApiAccountRead())
                .status(challenge.getStatus())
                .title(challenge.getTitle())
                .description(challenge.getDescription())
                .computation(challenge.getApiComputationReadWrite())
                .startDay(ifNotNull(challenge.getStartDate(), LocalDate::toEpochDay, null))
                .endDay(ifNotNull(challenge.getEndDate(), LocalDate::toEpochDay, null))
                .votingScore(voteService.getVoteCountByChallenge(challenge))
                .currentUserVote(voteService.getVoteByChallengeAndUser(challenge, account))
                .build();
    }

    public ChallengeReadDTO createChallenge(ChallengeWriteDTO challengeDTO, Account currentAccount) {
        Challenge challenge = new Challenge();
        challenge.applyChanges(challengeDTO);
        habitService.saveHabit(challenge.getRule().getInternalHabitForComputationOfGoal());
        notificationRuleService.saveNotificationRule(challenge.getRule());
        this.saveAndCheckChallenge(challenge, currentAccount);
        return this.getApiChallengeRead(challenge, currentAccount);
    }

    public ChallengeReadDTO updateChallenge(ChallengeWriteDTO challengeDTO, Account currentAccount) {
        Challenge challenge = challengeRepository.findById(challengeDTO.getChallengeId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Challenge not found with id: " + challengeDTO.getChallengeId()));
        challenge.applyChanges(challengeDTO);
        habitService.saveHabit(challenge.getRule().getInternalHabitForComputationOfGoal());
        notificationRuleService.saveNotificationRule(challenge.getRule());
        this.saveAndCheckChallenge(challenge, currentAccount);
        return this.getApiChallengeRead(challenge, currentAccount);
    }

    public boolean deleteChallenge(Long id) {
        Optional<Challenge> challengeOptional = challengeRepository.findById(id);
        if (challengeOptional.isEmpty()) {
            return false;
        }
        Challenge challenge = challengeOptional.get();
        if (challenge.getStatus() != ChallengeStatus.PROPOSED && challenge.getStatus() != ChallengeStatus.CREATED) {
            return false;
        }
        this.deleteChallenge(challenge);
        return true;
    }

    public ChallengeReadDTO proposeChallenge(Long id, Account account) {
        Optional<Challenge> challengeOptional = challengeRepository.findById(id);
        if (challengeOptional.isEmpty()) {
            throw new IllegalArgumentException("Challenge not found with id: " + id);
        }
        Challenge challenge = challengeOptional.get();
        if (challenge.getStatus() != ChallengeStatus.CREATED) {
            throw new IllegalArgumentException("Challenge is not in CREATED status");
        }
        this.propose(id, challenge.getCreator());
        return this.getApiChallengeRead(challenge, account);
    }

    public ChallengeOverviewReadDTO getChallengeOverview(Account account) {
        Challenge challenge = this.getCurrentlyActiveChallenge();
        List<LeaderBoardEntryReadDTO> leaderboard = this.getLeaderboard().entrySet().stream().map(
                entry -> LeaderBoardEntryReadDTO.builder().account(AccountReadDTO.builder()
                                .authenticationId(entry.getKey().getAuthenticationId())
                                .displayName(entry.getKey().getDisplayName())
                                .email(entry.getKey().getEmail())
                                .build())
                        .points(entry.getValue()).build()).toList();
        Map<Account, ChallengeProgress> progressMap =
                this.getScoresOfAccountsOfCurrentlyActiveChallenge(new HabitRecordSupplier(habitRecordRepository));
        List<ChallengeProgressReadDTO> progressCurrentChallengeUsers = progressMap.entrySet().stream()
                .map((entry) -> ChallengeProgressReadDTO.builder()
                        .account(entry.getKey().getApiAccountRead())
                        .linkToHabit(entry.getValue().getLinkToHabit())
                        .percentage(entry.getValue().getPercentage())
                        .absoluteValue(entry.getValue().getTotal())
                        .maxValue(entry.getValue().getMaxValue())
                        .build()).toList();
        return ChallengeOverviewReadDTO.builder()
                .activeChallenge(challenge != null ? this.getApiChallengeRead(challenge, account) : null)
                .proposedChallenges(this.getChallengeList(ChallengeStatus.PROPOSED, account, false))
                .createdChallenges(this.getChallengeList(ChallengeStatus.CREATED, account, true))
                .leaderboard(leaderboard)
                .progressCurrentChallengeUsers(progressCurrentChallengeUsers)
                .build();
    }

    public Challenge getLastMonthChallenge() {
        List<Challenge> challenges = challengeRepository.findAllByStatus(ChallengeStatus.COMPLETED);
        if (challenges.isEmpty()) {
            log.info("No completed challenge found");
            return null;
        } else {
            List<Challenge> challengesFiltered =
                    challenges.stream()
                            .filter(c ->
                                    c.getEndDate().isAfter(LocalDate.now().minusMonths(1)))
                            .toList();
            if (challengesFiltered.isEmpty()) {
                log.info("No completed challenge found in the last month");
                return null;
            } else {
                Challenge challenge = challengesFiltered.getFirst();
                log.info("Last completed challenge is {}", challenge.getTitle());
                return challenge;
            }
        }
    }
}
