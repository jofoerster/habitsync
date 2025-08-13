package de.jntn.habit.syncserver.controller;

import de.jntn.habit.syncserver.dto.HabitReadDTO;
import de.jntn.habit.syncserver.dto.HabitWriteDTO;
import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.habit.HabitType;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabitHabitPair;
import de.jntn.habit.syncserver.service.account.AccountService;
import de.jntn.habit.syncserver.service.habit.HabitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static de.jntn.habit.syncserver.controller.PermissionChecker.*;

@RestController
@RequestMapping("/habit")
public class HabitController {

    private final HabitService habitService;
    private final AccountService accountService;

    public HabitController(HabitService habitService, AccountService accountService) {
        this.habitService = habitService;
        this.accountService = accountService;
    }

    /**
     * Returns a list of all habits of the user.
     *
     * @return A list of {@link HabitReadDTO} objects representing the user's habits.
     */
    @GetMapping("/list")
    public ResponseEntity<List<HabitReadDTO>> getUserHabits() {
        return ResponseEntity.ok(habitService.getAllUserHabits(accountService.getCurrentAccount()));
    }

    /**
     * Retrieves a habit by its UUID.
     * User needs to own habit or have access to it via a shared habit.
     *
     * @param uuid The UUID of the habit to retrieve.
     * @return A ResponseEntity containing the {@link HabitReadDTO} object if found, or an error response if not found.
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<HabitReadDTO> getHabitByUuid(@PathVariable String uuid) {
        checkIfisAllowedToRead(habitService.getHabitByUuid(uuid).orElse(null), accountService.getCurrentAccount(),
                habitService);
        Optional<Habit> habit = habitService.getHabitByUuid(uuid);
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
    @PutMapping("/{uuid}")
    public ResponseEntity<HabitReadDTO> updateHabit(@PathVariable String uuid,
                                                    @RequestBody HabitWriteDTO habitWriteDTO) {
        checkIfisAllowedToEdit(habitService.getHabitByUuid(uuid).orElse(null), accountService.getCurrentAccount());
        return ResponseEntity.ok(habitService.updateHabit(uuid, habitWriteDTO));
    }

    /**
     * Deletes a habit by its UUID.
     *
     * @param uuid The UUID of the habit to delete.
     * @return A ResponseEntity indicating the result of the deletion operation.
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteHabit(@PathVariable String uuid) {
        checkIfisAllowedToDelete(habitService.getHabitByUuid(uuid).orElse(null), accountService.getCurrentAccount());
        boolean deleted = habitService.deleteHabit(uuid);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Returns a list of all habits connected to a specific habit (via a shared habit).
     * Should be used for displaying connected habits in the habit tracker view.
     *
     * @param uuid The UUID of the habit for which to retrieve connected habits.
     * @return A ResponseEntity containing a list of {@link HabitReadDTO} objects representing the connected habits.
     */
    @GetMapping("/connected-habits/{uuid}")
    public ResponseEntity<List<HabitReadDTO>> getConnectedHabits(@PathVariable String uuid) {
        checkIfisAllowedToEdit(habitService.getHabitByUuid(uuid).orElse(null), accountService.getCurrentAccount());
        List<SharedHabitHabitPair> habits =
                habitService.getAllRelatedHabitsToHabitOfUser(accountService.getCurrentAccount(), uuid,
                        HabitType.INTERNAL);
        return ResponseEntity.ok(habits.stream().map(SharedHabitHabitPair::getHabit)
                .filter(h -> !h.getUuid().equals(uuid))
                .collect(Collectors.toSet())
                .stream().map(habitService::getApiHabitReadFromHabit).toList());
    }

    @GetMapping("/connected-habits/{uuid}/count")
    public ResponseEntity<Long> getConnectedHabitCount(@PathVariable String uuid) {
        checkIfisAllowedToEdit(habitService.getHabitByUuid(uuid).orElse(null), accountService.getCurrentAccount());
        return ResponseEntity.ok(habitService.getNumberOfConnectedHabits(uuid, HabitType.INTERNAL));
    }

    @PostMapping("/{uuid}/sort-position/move-up")
    public ResponseEntity moveHabitUp(@PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        Account account = accountService.getCurrentAccount();
        checkIfisAllowedToEdit(habit, account);
        habitService.moveHabit(account, habit, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{uuid}/sort-position/move-down")
    public ResponseEntity moveHabitDown(@PathVariable String uuid) {
        Habit habit = habitService.getHabitByUuid(uuid).orElse(null);
        Account account = accountService.getCurrentAccount();
        checkIfisAllowedToEdit(habit, account);
        habitService.moveHabit(account, habit, false);
        return ResponseEntity.ok().build();
    }
}
