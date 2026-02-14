package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.SharedHabitReadDTO;
import de.jofoerster.habitsync.dto.SharedHabitWriteDTO;
import de.jofoerster.habitsync.dto.UserMedalsReadDTO;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.habit.SharedHabitService;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
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

@RestController
@RequestMapping("/api/shared-habit")
@Tag(name = "Shared Habits", description = "Shared habit management endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class SharedHabitController {

    private final SharedHabitService sharedHabitService;
    private final AccountService accountService;
    private final HabitService habitService;
    private final NotificationRuleService notificationRuleService;

    public SharedHabitController(SharedHabitService sharedHabitService, AccountService accountService,
                                 HabitService habitService, NotificationRuleService notificationRuleService) {
        this.sharedHabitService = sharedHabitService;
        this.accountService = accountService;
        this.habitService = habitService;
        this.notificationRuleService = notificationRuleService;
    }

    /**
     * Returns a list of all shared habits of the user.
     *
     * @return A list of {@link SharedHabitReadDTO} objects representing the user's shared habits.
     */
    @Operation(
            summary = "Get all user shared habits",
            description = "Returns a list of all shared habits the authenticated user is participating in."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved shared habits"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/list")
    public ResponseEntity<List<SharedHabitReadDTO>> getAllUserSharedHabits() {
        return ResponseEntity.ok(
                sharedHabitService.getSharedHabitsByAccount(accountService.getCurrentAccount(), habitService));
    }

    /**
     * Retrieves a shared habit by its share code.
     *
     * @param shareCode The share code of the shared habit to retrieve.
     * @return A ResponseEntity containing the {@link SharedHabitReadDTO} object if found, or an error response if not found.
     */
    @Operation(
            summary = "Get shared habit by share code",
            description = "Retrieves a specific shared habit by its unique share code."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved shared habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Shared habit not found")
    })
    @GetMapping("/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> getSharedHabitByShareCode(
            @Parameter(description = "Share code of the shared habit") @PathVariable String shareCode) {
        return ResponseEntity.ok(
                sharedHabitService.getApiSharedHabitReadFromSharedHabit(
                        sharedHabitService.getSharedHabitByCode(shareCode)
                                .orElseThrow(() -> new IllegalStateException(
                                        "Shared habit not found with share code: " + shareCode)), habitService));
    }

    /**
     * Creates a new shared habit.
     *
     * @param sharedHabitWrite The {@link SharedHabitWriteDTO} object containing the details of the shared habit to create.
     * @return A ResponseEntity containing the created {@link SharedHabitReadDTO} object.
     */
    @Operation(
            summary = "Create a new shared habit",
            description = "Creates a new shared habit that other users can join using the share code."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully created shared habit"),
            @ApiResponse(responseCode = "400", description = "Invalid shared habit data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @PostMapping
    public ResponseEntity<SharedHabitReadDTO> createSharedHabit(@RequestBody SharedHabitWriteDTO sharedHabitWrite) {
        return ResponseEntity.ok(
                sharedHabitService.createNewSharedHabit(sharedHabitWrite, accountService.getCurrentAccount(),
                        habitService));
    }

    /**
     * Updates an existing shared habit.
     *
     * @param sharedHabitWrite The {@link SharedHabitWriteDTO} object containing the updated details of the shared habit.
     * @return A ResponseEntity containing the updated {@link SharedHabitReadDTO} object.
     */
    @Operation(
            summary = "Update a shared habit",
            description = "Updates an existing shared habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated shared habit"),
            @ApiResponse(responseCode = "400", description = "Invalid shared habit data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Shared habit not found")
    })
    @PutMapping("/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> updateSharedHabit(
            @Parameter(description = "Share code of the shared habit") @PathVariable String shareCode,
            @RequestBody SharedHabitWriteDTO sharedHabitWrite) {
        return ResponseEntity.ok(
                sharedHabitService.updateSharedHabit(shareCode, sharedHabitWrite, accountService.getCurrentAccount(),
                        habitService)
        );
    }

    /**
     * Deletes a shared habit.
     *
     * @param sharedHabitWrite The {@link SharedHabitWriteDTO} object containing the details of the shared habit to delete.
     * @return A RequestEntity indicating the result of the deletion operation.
     */
    @Operation(
            summary = "Delete a shared habit",
            description = "Deletes a shared habit. Not yet implemented."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "500", description = "Not implemented yet"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @DeleteMapping("/{shareCode}")
    public ResponseEntity<String> deleteSharedHabit(
            @Parameter(description = "Share code of the shared habit") @PathVariable String shareCode,
            @RequestBody SharedHabitWriteDTO sharedHabitWrite) {
        return ResponseEntity.status(500).body("Not implemented yet");
    }

    /**
     * Joins a shared habit using a share code. Only works when user did not join this shared habit before
     *
     * @param shareCode The share code of the shared habit to join.
     * @param habitUuid Optional parameter to specify an existing habit to connect.
     *                  If empty a new habit will get created.
     * @return A ResponseEntity containing the {@link SharedHabitReadDTO} object representing the updated shared habit.
     */
    @Operation(
            summary = "Join a shared habit",
            description = "Joins a shared habit using a share code. Optionally link an existing habit or create a new one."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully joined shared habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Shared habit not found")
    })
    @PostMapping("/join/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> linkHabitToSharedHabit(
            @Parameter(description = "Share code of the shared habit to join") @PathVariable String shareCode,
            @Parameter(description = "UUID of existing habit to link (optional)") @RequestParam(required = false) String habitUuid) {
        return ResponseEntity.ok(sharedHabitService.getApiSharedHabitReadFromSharedHabit(
                habitService.addHabitToShared(sharedHabitService.getSharedHabitByCode(shareCode), habitUuid,
                        accountService.getCurrentAccount(),
                        accountService, notificationRuleService, sharedHabitService).orElse(null), habitService));
    }

    /**
     * Updates the connected habit to a shared habit of the current user.
     *
     * @param shareCode The share code of the shared habit to update.
     * @param habitUuid Optional parameter to specify an existing habit to connect. If empty a new habit will get created.
     * @return A ResponseEntity containing the {@link SharedHabitReadDTO} object representing the updated shared habit.
     */
    @Operation(
            summary = "Update linked habit for shared habit",
            description = "Changes which habit is linked to a shared habit for the current user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated link"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Shared habit not found")
    })
    @PutMapping("/join/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> updateLinkToSharedHabit(
            @Parameter(description = "Share code of the shared habit") @PathVariable String shareCode,
            @Parameter(description = "UUID of habit to link (optional)") @RequestParam(required = false) String habitUuid) {
        habitService.removeHabitFromShared(shareCode, accountService.getCurrentAccount(), sharedHabitService);
        return ResponseEntity.ok(sharedHabitService.getApiSharedHabitReadFromSharedHabit(
                habitService.addHabitToShared(sharedHabitService.getSharedHabitByCode(shareCode), habitUuid,
                        accountService.getCurrentAccount(),
                        accountService, notificationRuleService, sharedHabitService).orElse(null), habitService));
    }

    /**
     * Unlinks the users habit from a shared habit.
     *
     * @param shareCode The share code of the shared habit to leave.
     * @return A ResponseEntity indicating the result of the leave operation.
     */
    @Operation(
            summary = "Leave a shared habit",
            description = "Removes the current user's participation from a shared habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully left shared habit"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Shared habit not found")
    })
    @DeleteMapping("/leave/{shareCode}")
    public ResponseEntity<Void> leaveSharedHabit(
            @Parameter(description = "Share code of the shared habit to leave") @PathVariable String shareCode) {
        habitService.removeHabitFromShared(shareCode, accountService.getCurrentAccount(), sharedHabitService);
        return ResponseEntity.ok().build();
    }

    /**
     * Returns a list of all medals of the shared habit.
     *
     * @return A list of {@link UserMedalsReadDTO} objects representing medals of the shared habit.
     */
    @Operation(
            summary = "Get shared habit medals",
            description = "Returns a list of all medals earned by participants in a shared habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved medals"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Shared habit not found")
    })
    @GetMapping("/{shareCode}/medals")
    public ResponseEntity<List<UserMedalsReadDTO>> getMedals(
            @Parameter(description = "Share code of the shared habit") @PathVariable String shareCode) {
        List<UserMedalsReadDTO> medals = sharedHabitService.getMedalsForSharedHabit(shareCode);
        return ResponseEntity.ok(medals);
    }
}
