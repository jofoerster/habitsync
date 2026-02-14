package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.*;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitStatus;
import de.jofoerster.habitsync.model.habit.HabitType;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabitHabitPair;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.CachingHabitProgressHistoryService;
import de.jofoerster.habitsync.service.habit.CachingNumberOfConnectedHabitsService;
import de.jofoerster.habitsync.service.habit.HabitParticipationService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static de.jofoerster.habitsync.controller.PermissionChecker.checkIfIsOwner;

@RestController
@RequestMapping("/api/habit")
@Tag(name = "Habits", description = "Habit management endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class HabitController {

    private final HabitService habitService;
    private final AccountService accountService;
    private final NotificationService notificationService;
    private final HabitParticipationService habitParticipationService;

    private final PermissionChecker permissionChecker;
    private final CachingNumberOfConnectedHabitsService cachingNumberOfConnectedHabitsService;
    private final CachingHabitProgressHistoryService cachingHabitProgressHistoryService;

    public HabitController(HabitService habitService, AccountService accountService,
                           NotificationService notificationService, HabitParticipationService habitParticipationService,
                           PermissionChecker permissionChecker,
                           CachingNumberOfConnectedHabitsService cachingNumberOfConnectedHabitsService,
                           CachingHabitProgressHistoryService cachingHabitProgressHistoryService) {
        this.habitService = habitService;
        this.accountService = accountService;
        this.notificationService = notificationService;
        this.habitParticipationService = habitParticipationService;
        this.permissionChecker = permissionChecker;
        this.cachingNumberOfConnectedHabitsService = cachingNumberOfConnectedHabitsService;
        this.cachingHabitProgressHistoryService = cachingHabitProgressHistoryService;
    }

    /**
     * Returns a list of all habits of the user.
     *
     * @return A list of {@link HabitReadDTO} objects representing the user's habits.
     */
    @Operation(
            summary = "Get all user habits",
            description = "Returns a list of all habits belonging to the authenticated user, optionally filtered by status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved habits"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/list")
    public ResponseEntity<List<HabitReadDTO>> getUserHabits(
            @Parameter(description = "Filter habits by status") @RequestParam(required = false) HabitStatus statusFilter) {
        return ResponseEntity.ok(habitService.getAllUserHabits(accountService.getCurrentAccount(), statusFilter));
    }

    /**
     * Returns a list of all habit uuids of the user.
     *
     * @return A list of {@link HabitReadDTO} objects representing the user's habits.
     */
    @Operation(
            summary = "Get all user habit UUIDs",
            description = "Returns a list of UUIDs for all habits belonging to the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved habit UUIDs"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/uuids/list")
    public ResponseEntity<List<HabitReadUuidDTO>> getUserHabitUuids() {
        return ResponseEntity.ok(habitService.getAllUserHabitUuids(accountService.getCurrentAccount()));
    }

    /**
     * Retrieves a habit by its UUID.
     * User needs to own habit or have access to it via a shared habit.
     *
     * @param uuid The UUID of the habit to retrieve.
     * @return A ResponseEntity containing the {@link HabitReadDTO} object if found, or an error response if not found.
     */
    @Operation(
            summary = "Get habit by UUID",
            description = "Retrieves a specific habit by its UUID. User must own the habit or have access via a shared habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @GetMapping("/{uuid}")
    public ResponseEntity<HabitReadDTO> getHabitByUuid(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Optional<Habit> habit = habitService.getHabitByUuid(uuid);
        permissionChecker.checkIfisAllowedToRead(habit.orElse(null), accountService.getCurrentAccount(),
                habitService);
        return habit.map(value -> ResponseEntity.ok(
                        habitService.getApiHabitReadFromHabit(value)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Creates a new habit.
     *
     * @param apiHabitWrite The {@link HabitWriteDTO} object containing the details of the habit to create.
     * @return A ResponseEntity containing the created {@link HabitReadDTO} object.
     */
    @Operation(
            summary = "Create a new habit",
            description = "Creates a new habit for the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully created habit"),
            @ApiResponse(responseCode = "400", description = "Invalid habit data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @PostMapping
    public ResponseEntity<HabitReadDTO> createHabit(@RequestBody HabitWriteDTO apiHabitWrite) {
        return ResponseEntity.status(201)
                .body(habitService.createNewHabit(apiHabitWrite, accountService.getCurrentAccount()));
    }

    /**
     * Updates an existing habit.
     *
     * @param habitWriteDTO The {@link HabitWriteDTO} object containing the updated details of the habit.
     * @return A ResponseEntity containing the updated {@link HabitReadDTO} object.
     */
    @Operation(
            summary = "Update a habit",
            description = "Updates an existing habit. User must have edit permissions for the habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated habit"),
            @ApiResponse(responseCode = "400", description = "Invalid habit data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no edit access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PutMapping("/{uuid}")
    public ResponseEntity<HabitReadDTO> updateHabit(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid,
            @RequestBody HabitWriteDTO habitWriteDTO) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(uuid);
        permissionChecker.checkIfisAllowedToEdit(habitOpt.orElse(null), accountService.getCurrentAccount());
        habitOpt.ifPresent(notificationService::markHabitAsUpdated);
        return ResponseEntity.ok(habitService.updateHabit(uuid, habitWriteDTO));
    }

    /**
     * Deletes a habit by its UUID.
     *
     * @param uuid The UUID of the habit to delete.
     * @return A ResponseEntity indicating the result of the deletion operation.
     */
    @Operation(
            summary = "Delete a habit",
            description = "Deletes a habit by its UUID. User must have delete permissions for the habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Successfully deleted habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no delete access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteHabit(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(uuid);
        permissionChecker.checkIfisAllowedToDelete(habitService.getHabitByUuid(uuid).orElse(null),
                accountService.getCurrentAccount());
        if (habitOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Habit habit = habitService.deleteHabit(habitOpt.get());
        notificationService.deleteNotificationForHabit(habit);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns a list of all habits connected to a specific habit (via a shared habit).
     * Should be used for displaying connected habits in the habit tracker view.
     *
     * @param uuid The UUID of the habit for which to retrieve connected habits.
     * @return A ResponseEntity containing a list of {@link HabitReadDTO} objects representing the connected habits.
     */
    @Operation(
            summary = "Get connected habits",
            description = "Returns habits connected to a specific habit via shared habits."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved connected habits"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit")
    })
    @GetMapping("/connected-habits/{uuid}")
    public ResponseEntity<List<HabitReadDTO>> getConnectedHabits(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        permissionChecker.checkIfisAllowedToEdit(habitService.getHabitByUuid(uuid).orElse(null),
                accountService.getCurrentAccount());
        List<SharedHabitHabitPair> habits =
                habitService.getAllRelatedHabitsToHabitOfUser(accountService.getCurrentAccount(), uuid,
                        HabitType.INTERNAL);
        return ResponseEntity.ok(habits.stream().map(SharedHabitHabitPair::getHabit)
                .filter(h -> !h.getUuid().equals(uuid))
                .collect(Collectors.toSet())
                .stream().map(habitService::getApiHabitReadFromHabit).toList());
    }

    @Operation(
            summary = "Get connected habit count",
            description = "Returns the count of habits connected to a specific habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved count"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit")
    })
    @GetMapping("/connected-habits/{uuid}/count")
    public ResponseEntity<Long> getConnectedHabitCount(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        permissionChecker.checkIfisAllowedToEdit(habitService.getHabitByUuid(uuid).orElse(null),
                accountService.getCurrentAccount());
        return ResponseEntity.ok(cachingNumberOfConnectedHabitsService.getNumberOfConnectedHabits(uuid, HabitType.INTERNAL));
    }

    @Operation(
            summary = "Move habit up in sort order",
            description = "Moves a habit up in the user's habit sort order."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully moved habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit")
    })
    @PostMapping("/{uuid}/sort-position/move-up")
    public ResponseEntity moveHabitUp(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        Account account = accountService.getCurrentAccount();
        permissionChecker.checkIfisAllowedToEdit(habit, account);
        habitService.moveHabit(account, habit, true);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Move habit down in sort order",
            description = "Moves a habit down in the user's habit sort order."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully moved habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit")
    })
    @PostMapping("/{uuid}/sort-position/move-down")
    public ResponseEntity moveHabitDown(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        Account account = accountService.getCurrentAccount();
        permissionChecker.checkIfisAllowedToEdit(habit, account);
        habitService.moveHabit(account, habit, false);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Sort habits",
            description = "Reorders multiple habits in the user's habit list."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully sorted habits"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to one or more habits")
    })
    @PostMapping("/sort")
    public ResponseEntity sortHabits(@RequestBody HabitSortBody habitSortBody) {
        Account account = accountService.getCurrentAccount();
        List<Habit> habits = habitSortBody.getHabitUuids().stream().map(uuid -> {
            Habit habit  = habitService.getHabitByUuid(uuid).orElse(null);
            permissionChecker.checkIfisAllowedToEdit(habit, account);
            return habit;
        }).toList();
        habitService.sortHabits(habits, habitSortBody.getBefore(), habitSortBody.getAfter());
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Invite participant to habit",
            description = "Invites another user to participate in a habit. Only the habit owner can invite participants."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully sent invitation"),
            @ApiResponse(responseCode = "400", description = "Cannot invite yourself"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only habit owner can invite"),
            @ApiResponse(responseCode = "404", description = "Habit or user not found")
    })
    @PostMapping("/{uuid}/participant/invite/{participantAuthId}")
    public ResponseEntity<Void> inviteParticipant(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid,
            @Parameter(description = "Authentication ID of the user to invite") @PathVariable String participantAuthId) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountService.getCurrentAccount();
        Optional<Account> account1 = accountService.getAccountById(participantAuthId);
        if (account1.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (account1.get().getAuthenticationId().equals(account.getAuthenticationId())) {
            return ResponseEntity.badRequest().build();
        }
        checkIfIsOwner(habit, account);
        habitParticipationService.inviteParticipant(habit.getUuid(), participantAuthId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Remove participant from habit",
            description = "Removes a participant from a habit. Only the habit owner can remove participants."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully removed participant"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only habit owner can remove"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PostMapping("/{uuid}/participant/remove/{participantAuthId}")
    public ResponseEntity<Void> removeParticipant(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid,
            @Parameter(description = "Authentication ID of the participant to remove") @PathVariable String participantAuthId) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountService.getCurrentAccount();
        checkIfIsOwner(habit, account);
        habitParticipationService.removeParticipant(habit.getUuid(), participantAuthId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Accept habit participation invitation",
            description = "Accepts an invitation to participate in a habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully accepted invitation"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PostMapping("/{uuid}/participant/accept-invitation")
    public ResponseEntity<Void> acceptInvitation(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountService.getCurrentAccount();
        habitParticipationService.acceptInvitation(habit, account.getAuthenticationId());
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Decline habit participation invitation",
            description = "Declines an invitation to participate in a habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully declined invitation"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PostMapping("/{uuid}/participant/decline-invitation")
    public ResponseEntity<Void> declineInvitation(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountService.getCurrentAccount();
        habitParticipationService.declineInvitation(habit, account.getAuthenticationId());
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "List habit participants",
            description = "Lists all participants of a habit. Only the habit owner can list participants."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved participants"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only habit owner can list"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @GetMapping("/{uuid}/participant/list")
    public ResponseEntity<List<AccountReadDTO>> listParticipants(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountService.getCurrentAccount();
        checkIfIsOwner(habit, account);
        return ResponseEntity.ok(habitParticipationService.listParticipants(habit));
    }

    @Operation(
            summary = "Get habit percentage history",
            description = "Returns the percentage completion history for a habit in a specific month."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved history"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @GetMapping("/{uuid}/percentage-history")
    public ResponseEntity<PercentageHistoryDTO> getPercentageHistoryForMonth(
            @Parameter(description = "UUID of the habit") @PathVariable String uuid,
            @Parameter(description = "Month in format YYYY-MM") @RequestParam String month) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        Year year = Year.parse(month.substring(0, 4));
        int monthInt = Integer.parseInt(month.substring(5, 7));
        Account account = accountService.getCurrentAccount();
        permissionChecker.checkIfisAllowedToRead(habit, account, habitService);
        PercentageHistoryDTO dto = cachingHabitProgressHistoryService.getPercentageHistoryForMonth(habit, year, monthInt);
        return ResponseEntity.ok(dto);
    }

    @Operation(
            summary = "Get habit group names",
            description = "Returns all unique habit group names for the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved group names"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/group-names")
    public ResponseEntity<List<String>> getGroupNames() {
        Account account = accountService.getCurrentAccount();
        List<String> groupNames = habitService.getGroupNamesForAccount(account);
        return ResponseEntity.ok(groupNames);
    }
}
