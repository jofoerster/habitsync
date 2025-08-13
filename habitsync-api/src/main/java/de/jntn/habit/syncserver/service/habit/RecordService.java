package de.jntn.habit.syncserver.service.habit;

import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.repository.habit.HabitRecordRepository;
import org.springframework.stereotype.Service;

@Service
public class RecordService {

    private final HabitRecordRepository habitRecordRepository;

    public RecordService(HabitRecordRepository habitRecordRepository) {
        this.habitRecordRepository = habitRecordRepository;
    }

    public void importRecords(Habit habit) {
        habitRecordRepository.saveAll(habit.getRecords());
    }
}
