package de.jofoerster.habitsync.service.challenge;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.challenge.Challenge;
import de.jofoerster.habitsync.model.challenge.ChallengeProgress;
import de.jofoerster.habitsync.model.challenge.ChallengeResult;
import de.jofoerster.habitsync.model.challenge.ChallengeStatus;
import de.jofoerster.habitsync.repository.challenge.ChallengeRepository;
import de.jofoerster.habitsync.repository.challenge.ChallengeResultRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChallengeSchedulerService {

    private final ChallengeResultRepository challengeResultRepository;
    private final ChallengeRepository challengeRepository;
    private final VoteService voteService;
    private final ChallengeService challengeService;
    private final HabitRecordRepository habitRecordRepository;

    @Transactional
    @Scheduled(cron = "0 0 0 1 * *")
    public void changeChallenge() {
        Challenge challenge = challengeService.getCurrentlyActiveChallenge();
        if (challenge != null) {
            Map<Account, ChallengeProgress> scores =
                    challengeService.getScoresOfAccounts(new HabitRecordSupplier(habitRecordRepository));

            List<Map.Entry<Account, Double>> bestEntries = scores.entrySet()
                    .stream()
                    .map(e -> Map.entry(e.getKey(), e.getValue()
                            .getPercentage()))
                    .sorted(Map.Entry.<Account, Double>comparingByValue()
                            .reversed())
                    .toList();

            int currentPlacement = 0;
            double currentValue = Double.MAX_VALUE;

            List<ChallengeResult> resultList = new ArrayList<>();

            for (Map.Entry<Account, Double> entry : bestEntries) {
                if (entry.getValue() < currentValue) {
                    currentPlacement++;
                    currentValue = entry.getValue();
                }
                resultList.add(new ChallengeResult(entry.getKey(), challenge, entry.getValue(), 0, currentPlacement));
            }

            List<ChallengeResult> resultListFiltered = resultList.stream().filter(r -> {
                if (r.getAccount() == null || r.getAccount().getAuthenticationId() == null) {
                    log.warn("Challenge account is null for challenge result {}", r.getId());
                    return false;
                }
                return true;
            }).toList();

            challengeResultRepository.saveAll(resultListFiltered);

            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeRepository.save(challenge);
        }

        List<Challenge> challenges = getChallengesWithMostVotes();
        if (!challenges.isEmpty()) {
            Random rnd = new Random();
            Challenge challengeNew = challenges.get(rnd.nextInt(challenges.size()));
            challengeNew.setStatus(ChallengeStatus.ACTIVE);
            challengeNew.setStartDate(LocalDate.now());
            challengeNew.setEndDate(LocalDate.now()
                    .plusMonths(1)
                    .minusDays(1));
            challengeRepository.save(challengeNew);
        }
    }

    List<Challenge> getChallengesWithMostVotes() {
        List<Challenge> challenges = challengeRepository.findAllByStatus(ChallengeStatus.PROPOSED);
        int maxVotes = challenges.stream()
                .mapToInt(voteService::getVoteCountByChallenge)
                .max()
                .orElse(0);

        return challenges.stream()
                .filter(c -> voteService.getVoteCountByChallenge(c) == maxVotes)
                .collect(Collectors.toList());
    }

}
