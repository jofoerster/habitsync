package de.jntn.habit.syncserver.repository.habit;

import de.jntn.habit.syncserver.model.habit.HabitNumberModalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitNumberModalConfigRepository extends JpaRepository<HabitNumberModalConfig, String> {
    List<HabitNumberModalConfig> getHabitNumberModalConfigsByHabitUuid(String habitUuid);
}
