package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitType;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.repository.habit.HabitRepository;
import de.jofoerster.habitsync.repository.habit.SharedHabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CachingNumberOfConnectedHabitsService {

    private final HabitRepository habitRepository;
    private final SharedHabitRepository sharedHabitRepository;

    private final CacheManager cacheManager;

    @Cacheable(value = "connectedHabitsCountCache", key = "#habitUuid")
    public Long getNumberOfConnectedHabits(String habitUuid, HabitType habitType) {
        Optional<Habit> habit = habitRepository.findByUuid(habitUuid);
        if (habit.isEmpty()) {
            return 0L;
        }
        List<SharedHabit> sharedHabits = sharedHabitRepository.findAllByHabitsContaining(List.of(habit.get()));
        long result = 0L;
        for (SharedHabit sh : sharedHabits) {
            result += sh.getHabits().size() - 1; // -1 because the habit itself is included in the shared habits
        }
        return result;
    }

    public void evictCache(String habitUuid) {
        Objects.requireNonNull(cacheManager.getCache("connectedHabitsCountCache"))
                .evictIfPresent(habitUuid);
    }

}
