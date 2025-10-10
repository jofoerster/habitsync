package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.model.habit.HabitNumberModalConfig;
import de.jofoerster.habitsync.repository.habit.HabitNumberModalConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@RequiredArgsConstructor
@Service
public class HabitNumberModalConfigService {

    private final HabitNumberModalConfigRepository habitNumberModalConfigRepository;
    private final CacheManager cacheManager;

    @Cacheable(value = "habitNumberModalCache", key = "#habitUuid")
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
        Objects.requireNonNull(cacheManager.getCache("habitNumberModalCache"))
                .evictIfPresent(config.getHabitUuid());
        return habitNumberModalConfigRepository.save(config);
    }
}
