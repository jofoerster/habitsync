package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.ChallengeOverviewReadDTO;
import de.jofoerster.habitsync.dto.ChallengeReadDTO;
import de.jofoerster.habitsync.dto.ChallengeWriteDTO;
import de.jofoerster.habitsync.dto.HabitReadDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.challenge.Challenge;
import de.jofoerster.habitsync.model.challenge.ChallengeProgress;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.challenge.ChallengeService;
import de.jofoerster.habitsync.service.challenge.VoteService;
import de.jofoerster.habitsync.service.habit.CachingHabitProgressService;
import de.jofoerster.habitsync.service.habit.HabitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static de.jofoerster.habitsync.controller.PermissionChecker.checkIfisAllowedToDelete;
import static de.jofoerster.habitsync.controller.PermissionChecker.checkIfisAllowedToEdit;

@RestController
@RequestMapping("/api/challenge")
@Tag(name = "Challenges", description = "Challenge management endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class ChallengeController {

    private final ChallengeService challengeService;
    private final AccountService accountService;
    private final VoteService voteService;
    private final HabitService habitService;
    private final HabitRecordRepository habitRecordRepository;
    private final CachingHabitProgressService cachingHabitProgressService;

    public ChallengeController(ChallengeService challengeService, AccountService accountService,
                               VoteService voteService, HabitService habitService,
                               HabitRecordRepository habitRecordRepository,
                               CachingHabitProgressService cachingHabitProgressService) {
        this.challengeService = challengeService;
        this.accountService = accountService;
        this.voteService = voteService;
        this.habitService = habitService;
        this.habitRecordRepository = habitRecordRepository;
        this.cachingHabitProgressService = cachingHabitProgressService;
    }

    @Operation(
            summary = "Get challenge overview",
            description = "Returns an overview of the current challenge including progress and status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved challenge overview"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
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
    @Operation(
            summary = "Get challenge list",
            description = "Returns a list of all challenges. CREATED challenges are only visible to creators, PROPOSED challenges are visible to all."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved challenges"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/list")
    public ResponseEntity<List<ChallengeReadDTO>> getChallengeList() {
        return ResponseEntity.ok(challengeService.getChallengeList(accountService.getCurrentAccount()));
    }

    @Operation(
            summary = "Get challenge by ID",
            description = "Retrieves a specific challenge by its ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved challenge"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Challenge not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ChallengeReadDTO> getChallengeById(
            @Parameter(description = "ID of the challenge") @PathVariable Long id) {
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
    @Operation(
            summary = "Create a new challenge",
            description = "Creates a new challenge in CREATED status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully created challenge"),
            @ApiResponse(responseCode = "400", description = "Invalid challenge data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
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
    @Operation(
            summary = "Update a challenge",
            description = "Updates an existing challenge. Only the creator can update and challenge must be in CREATED status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated challenge"),
            @ApiResponse(responseCode = "400", description = "Invalid challenge data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only creator can update")
    })
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
    @Operation(
            summary = "Delete a challenge",
            description = "Deletes a challenge. Only the creator can delete and challenge must be in CREATED or PROPOSED status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Successfully deleted challenge"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only creator can delete"),
            @ApiResponse(responseCode = "404", description = "Challenge not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChallenge(
            @Parameter(description = "ID of the challenge") @PathVariable Long id) {
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
    @Operation(
            summary = "Propose a challenge",
            description = "Changes a challenge from CREATED to PROPOSED status, making it visible for voting."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully proposed challenge"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only creator can propose")
    })
    @PostMapping("/{id}/propose")
    public ResponseEntity<ChallengeReadDTO> proposeChallenge(
            @Parameter(description = "ID of the challenge") @PathVariable Long id) {
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
    @Operation(
            summary = "Vote on a challenge",
            description = "Cast a vote on a proposed challenge. True for upvote, false for downvote."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully voted"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Challenge not found or not votable")
    })
    @PostMapping("{id}/vote")
    public ResponseEntity<ChallengeReadDTO> voteOnChallenge(
            @Parameter(description = "ID of the challenge") @PathVariable Long id,
            @Parameter(description = "Vote: true for upvote, false for downvote") @RequestParam Boolean vote) {
        Challenge votedChallenge = challengeService.getChallengeById(id)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found or not votable"));
        voteService.createOrUpdateVote(accountService.getCurrentAccount(), votedChallenge,
                vote == Boolean.TRUE ? 1 : -1);
        return ResponseEntity.ok(
                challengeService.getApiChallengeRead(votedChallenge, accountService.getCurrentAccount()));
    }

    @Operation(
            summary = "Get user's challenge habit",
            description = "Returns the user's challenge habit, creating one if it doesn't exist."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved challenge habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("challenge-habit")
    public ResponseEntity<HabitReadDTO> getChallengeHabitForUser() {
        List<Habit> challengeHabits = habitService.getChallengeHabits(accountService.getCurrentAccount());
        if (challengeHabits.isEmpty()) {
            return ResponseEntity.ok(habitService.getApiHabitReadFromHabit(
                    habitService.createChallengeHabitForAccount(accountService.getCurrentAccount())));
        } else {
            Challenge challenge = challengeService.getCurrentlyActiveChallenge();
            Habit challengeHabit = challengeHabits.getFirst();
            Map<Account, ChallengeProgress> progress = challenge != null ? challenge.getProgressOfHabits(List.of(challengeHabit),
                    new HabitRecordSupplier(habitRecordRepository), cachingHabitProgressService) : Map.of();
            HabitReadDTO habit = habitService.getApiHabitReadFromHabit(challengeHabit);
            habit.setCurrentPercentage(challenge != null ? progress.get(accountService.getCurrentAccount()).getPercentage() : 0);
            return ResponseEntity.ok(habit);
        }
    }
}
