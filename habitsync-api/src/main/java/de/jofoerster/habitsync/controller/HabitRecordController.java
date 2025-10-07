package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.HabitRecordReadDTO;
import de.jofoerster.habitsync.dto.HabitRecordWriteDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.HabitRecordService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.notification.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/record")
public class HabitRecordController {

    private final HabitService habitService;
    private final AccountService accountService;
    private final HabitRecordService habitRecordService;
    private final NotificationService notificationService;

    private final PermissionChecker permissionChecker;

    public HabitRecordController(HabitService habitService, AccountService accountService,
                                 HabitRecordService habitRecordService, NotificationService notificationService,
                                 PermissionChecker permissionChecker) {
        this.habitService = habitService;
        this.accountService = accountService;
        this.habitRecordService = habitRecordService;
        this.notificationService = notificationService;
        this.permissionChecker = permissionChecker;
    }

    /**
     * Returns a list of all records for a specific habit.
     *
     * @param habitUuid    The UUID of the habit for which to retrieve records.
     * @param epochDayFrom Optional parameter to filter records from a specific epoch day.
     * @param epochDayTo   Optional parameter to filter records up to a specific epoch day.
     * @return A ResponseEntity containing a list of {@link HabitRecordReadDTO} objects representing the records of the specified habit.
     */
    @GetMapping("/{habitUuid}")
    public ResponseEntity<List<HabitRecordReadDTO>> getRecords(@PathVariable String habitUuid,
                                                               @RequestParam(required = false) Integer epochDayFrom,
                                                               @RequestParam(required = false) Integer epochDayTo) {
        permissionChecker.checkIfisAllowedToRead(habitService.getHabitByUuid(habitUuid).orElse(null),
                accountService.getCurrentAccount(), habitService);
        return ResponseEntity.ok(habitRecordService.getRecords(habitUuid, epochDayFrom, epochDayTo));
    }

    /**
     * Creates a new record for a specific habit.
     *
     * @param habitUuid   The UUID of the habit for which to create a record.
     * @param recordWrite The {@link HabitRecordWriteDTO} object containing the details of the record to create.
     * @return A ResponseEntity containing the created {@link HabitRecordReadDTO} object.
     */
    @PostMapping("/{habitUuid}")
    public ResponseEntity<HabitRecordReadDTO> createRecord(@PathVariable String habitUuid,
                                                           @RequestBody HabitRecordWriteDTO recordWrite) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(habitUuid);
        permissionChecker.checkIfisAllowedToEdit(habitOpt.orElse(null), accountService.getCurrentAccount());
        habitOpt.ifPresent(notificationService::markHabitAsUpdated);
        return ResponseEntity.ok(habitRecordService.createRecord(habitUuid, recordWrite));
    }
}
