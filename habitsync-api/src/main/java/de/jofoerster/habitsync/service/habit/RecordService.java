package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
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
