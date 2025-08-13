package de.jntn.habit.syncserver.controller;

import de.jntn.habit.syncserver.dto.ChallengeOverviewReadDTO;
import de.jntn.habit.syncserver.dto.ChallengeReadDTO;
import de.jntn.habit.syncserver.dto.ChallengeWriteDTO;
import de.jntn.habit.syncserver.dto.HabitReadDTO;
import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.challenge.Challenge;
import de.jntn.habit.syncserver.model.challenge.ChallengeProgress;
import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.repository.habit.HabitRecordRepository;
import de.jntn.habit.syncserver.repository.habit.HabitRecordSupplier;
import de.jntn.habit.syncserver.service.account.AccountService;
import de.jntn.habit.syncserver.service.challenge.ChallengeService;
import de.jntn.habit.syncserver.service.challenge.VoteService;
import de.jntn.habit.syncserver.service.habit.HabitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static de.jntn.habit.syncserver.controller.PermissionChecker.checkIfisAllowedToDelete;
import static de.jntn.habit.syncserver.controller.PermissionChecker.checkIfisAllowedToEdit;

@RestController
@RequestMapping("/challenge")
public class ChallengeController {

    private final ChallengeService challengeService;
    private final AccountService accountService;
    private final VoteService voteService;
    private final HabitService habitService;
    private final HabitRecordRepository habitRecordRepository;

    public ChallengeController(ChallengeService challengeService, AccountService accountService,
                               VoteService voteService, HabitService habitService,
                               HabitRecordRepository habitRecordRepository) {
        this.challengeService = challengeService;
        this.accountService = accountService;
        this.voteService = voteService;
        this.habitService = habitService;
        this.habitRecordRepository = habitRecordRepository;
    }

    @GetMapping("/overview")
    public ResponseEntity<ChallengeOverviewReadDTO> getCurrentChallengeOverview() {
        return ResponseEntity.ok(challengeService.getChallengeOverview(accountService.getCurrentAccount()));
    }

    /**
     * Returns a list of all challenges.
     * Challenges with status "CREATED" can be edited only by the creator
     * (this endpoint only returns the users own challenges in CREATED status).
     * Challenges with status "PROPOSED" can be deleted by the creator.
     * Everybody can vote on all PROPOSED challenges.
     *
     * @return
     */
    @GetMapping("/list")
    public ResponseEntity<List<ChallengeReadDTO>> getChallengeList() {
        return ResponseEntity.ok(challengeService.getChallengeList(accountService.getCurrentAccount()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChallengeReadDTO> getChallengeById(@PathVariable Long id) {
        Challenge challenge = challengeService.getChallengeById(id)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));
        return ResponseEntity.ok(challengeService.getApiChallengeRead(challenge, accountService.getCurrentAccount()));
    }

    /**
     * Creates a new challenge.
     *
     * @param challenge The {@link ChallengeWriteDTO} object containing the details of the challenge to create.
     * @return A ResponseEntity containing the created {@link ChallengeReadDTO} object.
     */
    @PostMapping
    public ResponseEntity<ChallengeReadDTO> createChallenge(@RequestBody ChallengeWriteDTO challenge) {
        ChallengeReadDTO createdChallenge =
                challengeService.createChallenge(challenge, accountService.getCurrentAccount());
        return ResponseEntity.status(201).body(createdChallenge);
    }

    /**
     * Updates an existing challenge.
     *
     * @param challenge The {@link ChallengeWriteDTO} object containing the updated details of the challenge.
     * @return A ResponseEntity containing the updated {@link ChallengeReadDTO} object.
     */
    @PutMapping
    public ResponseEntity<ChallengeReadDTO> updateChallenge(@RequestBody ChallengeWriteDTO challenge) {
        checkIfisAllowedToEdit(challengeService.getChallengeById(challenge.getChallengeId()).orElse(null),
                accountService.getCurrentAccount());
        ChallengeReadDTO updatedChallenge =
                challengeService.updateChallenge(challenge, accountService.getCurrentAccount());
        return ResponseEntity.ok(updatedChallenge);
    }

    /**
     * Deletes a challenge by its ID. Only the creator can delete a challenge.
     * Challenge has to be in status "PROPOSED" or "CREATED" to be deletable.
     *
     * @param id The ID of the challenge to delete.
     * @return A ResponseEntity indicating the result of the deletion operation.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChallenge(@PathVariable Long id) {
        checkIfisAllowedToDelete(challengeService.getChallengeById(id).orElse(null),
                accountService.getCurrentAccount());
        boolean deleted = challengeService.deleteChallenge(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Proposes a challenge. Only the creator can propose a challenge.
     * Challenge has to be in status "CREATED" to be proposed.
     *
     * @param id The ID of the challenge to propose.
     * @return A ResponseEntity containing the proposed {@link ChallengeReadDTO} object.
     */
    @PostMapping("/{id}/propose")
    public ResponseEntity<ChallengeReadDTO> proposeChallenge(@PathVariable Long id) {
        checkIfisAllowedToEdit(challengeService.getChallengeById(id).orElse(null), accountService.getCurrentAccount());
        ChallengeReadDTO proposedChallenge = challengeService.proposeChallenge(id, accountService.getCurrentAccount());
        return ResponseEntity.ok(proposedChallenge);
    }

    /**
     * Votes on a challenge. Challenge has to be in status "PROPOSED" to be votable.
     *
     * @param id   The ID of the challenge to vote on.
     * @param vote Boolean indicating the vote (true for upvote, false for downvote).
     * @return A ResponseEntity containing the updated {@link ChallengeReadDTO} object after voting.
     */
    @PostMapping("{id}/vote")
    public ResponseEntity<ChallengeReadDTO> voteOnChallenge(@PathVariable Long id, @RequestParam Boolean vote) {
        Challenge votedChallenge = challengeService.getChallengeById(id)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found or not votable"));
        voteService.createOrUpdateVote(accountService.getCurrentAccount(), votedChallenge,
                vote == Boolean.TRUE ? 1 : -1);
        return ResponseEntity.ok(
                challengeService.getApiChallengeRead(votedChallenge, accountService.getCurrentAccount()));
    }

    @GetMapping("challenge-habit")
    public ResponseEntity<HabitReadDTO> getChallengeHabitForUser() {
        List<Habit> challengeHabits = habitService.getChallengeHabits(accountService.getCurrentAccount());
        if (challengeHabits.isEmpty()) {
            return ResponseEntity.ok(habitService.getApiHabitReadFromHabit(
                    habitService.createChallengeHabitForAccount(accountService.getCurrentAccount())));
        } else {
            Challenge challenge = challengeService.getCurrentlyActiveChallenge();
            Habit challengeHabit = challengeHabits.getFirst();
            Map<Account, ChallengeProgress> progress = challenge.getProgressOfHabits(List.of(challengeHabit),
                    new HabitRecordSupplier(habitRecordRepository));
            HabitReadDTO habit = habitService.getApiHabitReadFromHabit(challengeHabit);
            habit.setCurrentPercentage(progress.get(accountService.getCurrentAccount()).getPercentage());
            return ResponseEntity.ok(habit);
        }
    }
}
