package de.jntn.habit.syncserver.controller;

import de.jntn.habit.syncserver.dto.SharedHabitReadDTO;
import de.jntn.habit.syncserver.dto.SharedHabitWriteDTO;
import de.jntn.habit.syncserver.dto.UserMedalsReadDTO;
import de.jntn.habit.syncserver.service.account.AccountService;
import de.jntn.habit.syncserver.service.habit.HabitService;
import de.jntn.habit.syncserver.service.habit.SharedHabitService;
import de.jntn.habit.syncserver.service.notification.NotificationRuleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shared-habit")
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
    @GetMapping("/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> getSharedHabitByShareCode(@PathVariable String shareCode) {
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
    @PutMapping("/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> updateSharedHabit(@PathVariable String shareCode,
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
    @DeleteMapping("/{shareCode}")
    public ResponseEntity<String> deleteSharedHabit(@PathVariable String shareCode,
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
    @PostMapping("/join/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> linkHabitToSharedHabit(@PathVariable String shareCode,
                                                                     @RequestParam(required = false) String habitUuid) {
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
    @PutMapping("/join/{shareCode}")
    public ResponseEntity<SharedHabitReadDTO> updateLinkToSharedHabit(@PathVariable String shareCode,
                                                                      @RequestParam(
                                                                              required = false) String habitUuid) {
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
    @DeleteMapping("/leave/{shareCode}")
    public ResponseEntity<Void> leaveSharedHabit(@PathVariable String shareCode) {
        habitService.removeHabitFromShared(shareCode, accountService.getCurrentAccount(), sharedHabitService);
        return ResponseEntity.ok().build();
    }

    /**
     * Returns a list of all medals of the shared habit.
     *
     * @return A list of {@link UserMedalsReadDTO} objects representing medals of the shared habit.
     */
    @GetMapping("/{shareCode}/medals")
    public ResponseEntity<List<UserMedalsReadDTO>> getMedals(@PathVariable String shareCode) {
        List<UserMedalsReadDTO> medals = sharedHabitService.getMedalsForSharedHabit(shareCode);
        return ResponseEntity.ok(medals);
    }
}
