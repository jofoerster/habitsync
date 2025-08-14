package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.dto.HabitNumberModalConfigDTO;
import de.jofoerster.habitsync.model.habit.HabitNumberModalConfig;
import de.jofoerster.habitsync.service.habit.HabitNumberModalConfigService;
import de.jofoerster.habitsync.service.habit.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Controller
@RequestMapping("/habitNumberModalConfig")
@RestController
@RequiredArgsConstructor
public class HabitNumberModalConfigController {

    private final HabitService habitService;
    private final HabitNumberModalConfigService habitNumberModalConfigService;

    @PostMapping("/{habitUuid}/add/{number}")
    public ResponseEntity addHabitNumberModalConfigValue(@PathVariable String habitUuid, @PathVariable String number) {
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

    @PostMapping("/{habitUuid}/remove/{number}")
    public ResponseEntity removeHabitNumberModalConfigValue(@PathVariable String habitUuid,
                                                            @PathVariable String number) {
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

    @GetMapping("/{habitUuid}")
    public ResponseEntity<HabitNumberModalConfigDTO> getHabitNumberModalConfig(@PathVariable String habitUuid) {
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
