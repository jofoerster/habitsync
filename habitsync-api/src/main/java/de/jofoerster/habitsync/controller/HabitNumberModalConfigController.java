package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.dto.HabitNumberModalConfigDTO;
import de.jofoerster.habitsync.model.habit.HabitNumberModalConfig;
import de.jofoerster.habitsync.service.habit.HabitNumberModalConfigService;
import de.jofoerster.habitsync.service.habit.HabitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Controller
@RequestMapping("/api/habitNumberModalConfig")
@RestController
@RequiredArgsConstructor
@Tag(name = "Habit Number Modal Config", description = "Habit number modal configuration endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class HabitNumberModalConfigController {

    private final HabitService habitService;
    private final HabitNumberModalConfigService habitNumberModalConfigService;

    @Operation(
            summary = "Add number modal config value",
            description = "Adds a quick-select number value to the habit's number modal configuration."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully added config value"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PostMapping("/{habitUuid}/add/{number}")
    public ResponseEntity addHabitNumberModalConfigValue(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @Parameter(description = "Number value to add") @PathVariable String number) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(habitUuid);
        if (habitOpt.isPresent()) {
            HabitNumberModalConfig config = habitNumberModalConfigService.getHabitNumberModalConfig(habitUuid);
            config.addConfigValue(number);
            habitNumberModalConfigService.save(config);
        } else {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Remove number modal config value",
            description = "Removes a quick-select number value from the habit's number modal configuration."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully removed config value"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @PostMapping("/{habitUuid}/remove/{number}")
    public ResponseEntity removeHabitNumberModalConfigValue(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid,
            @Parameter(description = "Number value to remove") @PathVariable String number) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(habitUuid);
        if (habitOpt.isPresent()) {
            HabitNumberModalConfig config = habitNumberModalConfigService.getHabitNumberModalConfig(habitUuid);
            config.removeConfigValue(number);
            habitNumberModalConfigService.save(config);
        } else {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Get number modal config",
            description = "Returns the number modal configuration for a specific habit."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved config"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "404", description = "Habit not found")
    })
    @GetMapping("/{habitUuid}")
    public ResponseEntity<HabitNumberModalConfigDTO> getHabitNumberModalConfig(
            @Parameter(description = "UUID of the habit") @PathVariable String habitUuid) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(habitUuid);
        if (habitOpt.isPresent()) {
            return ResponseEntity.ok(habitNumberModalConfigService
                    .getHabitNumberModalConfig(habitUuid)
                    .getApiHabitNumberModalConfig());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
