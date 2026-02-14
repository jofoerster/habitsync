package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.HabitRecordReadDTO;
import de.jofoerster.habitsync.dto.HabitRecordWriteDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.habit.CachingHabitRecordService;
import de.jofoerster.habitsync.service.habit.HabitRecordService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.TimeZone;

@RestController
@RequestMapping("/api/record")
@Tag(name = "Habit Records", description = "Habit record/tracking endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class HabitRecordController {

    private final HabitService habitService;
    private final AccountService accountService;
    private final HabitRecordService habitRecordService;
    private final NotificationService notificationService;

    private final PermissionChecker permissionChecker;
    private final CachingHabitRecordService cachingHabitRecordService;

    public HabitRecordController(HabitService habitService, AccountService accountService,
                                 HabitRecordService habitRecordService, NotificationService notificationService,
                                 PermissionChecker permissionChecker,
                                 CachingHabitRecordService cachingHabitRecordService) {
        this.habitService = habitService;
        this.accountService = accountService;
        this.habitRecordService = habitRecordService;
        this.notificationService = notificationService;
        this.permissionChecker = permissionChecker;
        this.cachingHabitRecordService = cachingHabitRecordService;
    }

    /**
     * Returns a list of all records for a specific habit.
     *
     * @param habitUuid    The UUID of the habit for which to retrieve records.
     * @param epochDayFrom Optional parameter to filter records from a specific epoch day.
     * @param epochDayTo   Optional parameter to filter records up to a specific epoch day.
     * @return A ResponseEntity containing a list of {@link HabitRecordReadDTO} objects representing the records of the specified habit.
     */
    @Operation(
            summary = "Get habit records",
            description = "Returns a list of all records for a specific habit, optionally filtered by date range."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved records"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @GetMapping("/{habitUuid}")
    public ResponseEntity<List<HabitRecordReadDTO>> getRecords(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @Parameter(description = "Filter records from this epoch day") @RequestParam(required = false) Integer epochDayFrom,
            @Parameter(description = "Filter records until this epoch day") @RequestParam(required = false) Integer epochDayTo) {
        Habit habit = habitService.getHabitByUuid(habitUuid).orElse(null);
        permissionChecker.checkIfisAllowedToRead(habit,
                accountService.getCurrentAccount(), habitService);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(habitRecordService.getRecords(habit, epochDayFrom, epochDayTo));
    }

    @Operation(
            summary = "Get simplified habit record",
            description = "Returns a single habit record for a specific day with optional offset from today."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved record"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no access to this habit"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @GetMapping("/{habitUuid}/simple")
    public ResponseEntity<HabitRecordReadDTO> getRecordSimplified(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @Parameter(description = "Day offset from today (0 = today, -1 = yesterday)") @RequestParam(required = false) Integer offset,
            @Parameter(description = "Timezone for day calculation") @RequestParam(required = false) TimeZone timeZone) {
        Habit habit = habitService.getHabitByUuid(habitUuid).orElse(null);
        permissionChecker.checkIfisAllowedToRead(habit,
                accountService.getCurrentAccount(), habitService);
        if (habit == null) {
            return ResponseEntity.notFound().build();
        }
        TimeZone tzToUse = timeZone != null ? timeZone : TimeZone.getDefault();
        int offsetToUse = offset != null ? offset : 0;
        int epochDay = (int) LocalDate.now(tzToUse.toZoneId()).plusDays(offsetToUse).toEpochDay();
        return ResponseEntity.ok(cachingHabitRecordService.getHabitRecordByHabitAndEpochDay(habit, epochDay));
    }

    /**
     * Creates a new record for a specific habit.
     *
     * @param habitUuid   The UUID of the habit for which to create a record.
     * @param recordWrite The {@link HabitRecordWriteDTO} object containing the details of the record to create.
     * @return A ResponseEntity containing the created {@link HabitRecordReadDTO} object.
     */
    @Operation(
            summary = "Create habit record",
            description = "Creates a new tracking record for a specific habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully created record"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no edit access to this habit")
    })
    @PostMapping("/{habitUuid}")
    public ResponseEntity<HabitRecordReadDTO> createRecord(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @RequestBody HabitRecordWriteDTO recordWrite) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(habitUuid);
        permissionChecker.checkIfisAllowedToEdit(habitOpt.orElse(null), accountService.getCurrentAccount());
        HabitRecordReadDTO record = cachingHabitRecordService.createRecord(habitOpt.get(), recordWrite);
        habitOpt.ifPresent(notificationService::markHabitAsUpdated);
        return ResponseEntity.ok(record);
    }

    @Operation(
            summary = "Create simplified habit record",
            description = "Creates a habit record using simplified parameters - useful for quick tracking."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully created record"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no edit access to this habit")
    })
    @PostMapping("/{habitUuid}/simple")
    public ResponseEntity<HabitRecordReadDTO> createRecordSimplified(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @Parameter(description = "Record value (default: 1)") @RequestParam(required = false) Double value,
            @Parameter(description = "Day offset from today (0 = today, -1 = yesterday)") @RequestParam(required = false) Integer offset,
            @Parameter(description = "Timezone for day calculation") @RequestParam(required = false) TimeZone timeZone) {
        TimeZone tzToUse = timeZone != null ? timeZone : TimeZone.getDefault();
        int offsetToUse = offset != null ? offset : 0;
        double valueToUse = value != null ? value : 1;
        int epochDay = (int) LocalDate.now(tzToUse.toZoneId()).plusDays(offsetToUse).toEpochDay();
        HabitRecordWriteDTO recordWrite = HabitRecordWriteDTO.builder()
                .epochDay(epochDay)
                .recordValue(valueToUse)
                .build();
        return createRecord(habitUuid, recordWrite);
    }
}
