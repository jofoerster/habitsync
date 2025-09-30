package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.HabitReadDTO;
import de.jofoerster.habitsync.dto.HabitWriteDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitType;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabitHabitPair;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.notification.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static de.jofoerster.habitsync.controller.PermissionChecker.*;

@RestController
@RequestMapping("/api/habit")
public class HabitController {

    private final HabitService habitService;
    private final AccountService accountService;
    private final NotificationService notificationService;

    public HabitController(HabitService habitService, AccountService accountService,
                           NotificationService notificationService) {
        this.habitService = habitService;
        this.accountService = accountService;
        this.notificationService = notificationService;
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
        Optional<Habit> habit = habitService.getHabitByUuid(uuid);
        checkIfisAllowedToRead(habit.orElse(null), accountService.getCurrentAccount(),
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
        Optional<Habit> habitOpt = habitService.getHabitByUuid(uuid);
        checkIfisAllowedToEdit(habitOpt.orElse(null), accountService.getCurrentAccount());
        habitOpt.ifPresent(notificationService::markHabitAsUpdated);
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
        Optional<Habit> habitOpt = habitService.getHabitByUuid(uuid);
        checkIfisAllowedToDelete(habitService.getHabitByUuid(uuid).orElse(null), accountService.getCurrentAccount());
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
