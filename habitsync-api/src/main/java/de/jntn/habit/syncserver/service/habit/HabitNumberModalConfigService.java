package de.jntn.habit.syncserver.service.habit;

import de.jntn.habit.syncserver.model.habit.HabitNumberModalConfig;
import de.jntn.habit.syncserver.repository.habit.HabitNumberModalConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class HabitNumberModalConfigService {

    private final HabitNumberModalConfigRepository habitNumberModalConfigRepository;

    public HabitNumberModalConfig getHabitNumberModalConfig(String habitUuid) {
        List<HabitNumberModalConfig> configs =
                habitNumberModalConfigRepository.getHabitNumberModalConfigsByHabitUuid(habitUuid);
        if (configs.isEmpty()) {
            return createNewDefaultConfig(habitUuid);
        } else {
            return configs.getFirst();
        }
    }

    private HabitNumberModalConfig createNewDefaultConfig(String habitUuid) {
        HabitNumberModalConfig habitNumberModalConfig = new HabitNumberModalConfig();
        habitNumberModalConfig.setConfigValues("1;2;3;5;10;30;60;+1;+5");
        habitNumberModalConfig.setHabitUuid(habitUuid);
        habitNumberModalConfigRepository.save(habitNumberModalConfig);
        return habitNumberModalConfig;
    }

    public HabitNumberModalConfig save(HabitNumberModalConfig config) {
        return habitNumberModalConfigRepository.save(config);
    }
}
