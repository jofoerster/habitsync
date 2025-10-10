package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.dto.HabitRecordReadDTO;
import de.jofoerster.habitsync.dto.HabitRecordWriteDTO;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitRecord;
import de.jofoerster.habitsync.model.habit.HabitRecordCompletion;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitRecordService {
    private final HabitRecordRepository habitRecordRepository;
    private final CachingHabitProgressService cachingHabitProgressService;

    private HabitRecordCompletion getHabitRecordStatus(Habit habit, HabitRecord habitRecord) {
        boolean completion = cachingHabitProgressService.getCompletionForDay(
                LocalDate.ofEpochDay(habitRecord.getRecordDate()), habit);
        if (habit.getDailyGoal() != null &&
                habitRecord.getRecordValue() >= habit.getDailyGoal()) {
            return HabitRecordCompletion.COMPLETED;
        } else if (completion) {
            return HabitRecordCompletion.COMPLETED_BY_OTHER_RECORDS;
        }
        return habitRecord.getRecordValue() > 0
                ? HabitRecordCompletion.PARTIALLY_COMPLETED
                : HabitRecordCompletion.MISSED;
    }

    public HabitRecordReadDTO getApiRecordFromRecord(Habit habit, HabitRecord habitRecord) {
        return HabitRecordReadDTO.builder()
                .uuid(habitRecord.getUuid())
                .habitUuid(habitRecord.getParentUuid())
                .epochDay(habitRecord.getRecordDate())
                .recordValue(habitRecord.getRecordValue())
                .completion(getHabitRecordStatus(habit, habitRecord))
                .build();
    }

    public List<HabitRecordReadDTO> getRecords(Habit habit, Integer epochDayFrom, Integer epochDayTo) {
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordsByParentUuidAndRecordDateBetween(habit.getUuid(), epochDayFrom,
                        epochDayTo);
        for (Integer day = epochDayFrom; day <= epochDayTo; day++) {
            Integer finalRecord = day;
            if (records.stream().noneMatch(r -> r.getRecordDate().equals(finalRecord))) {
                records.add(HabitRecord.builder()
                        .parentUuid(habit.getUuid())
                        .recordValue(0d)
                        .recordDate(day).build());
            }
        }
        return records.stream().map(h -> this.getApiRecordFromRecord(habit, h)).toList();
    }

    HabitRecordReadDTO createRecord(Habit habit, HabitRecordWriteDTO recordWrite) {
        Integer recordDay = recordWrite.getEpochDay();
        if (recordDay == null) {
            recordDay = (int) LocalDate.now().toEpochDay();
        }
        cachingHabitProgressService.onHabitChanged(habit, recordDay);
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordByRecordDateAndParentUuid(recordDay, habit.getUuid());
        HabitRecord habitRecord;
        if (records.isEmpty()) {
            habitRecord = new HabitRecord();
            habitRecord.setParentUuid(habit.getUuid());
            habitRecord.setRecordDate(recordDay);
        } else {
            if (records.size() > 1) {
                records.sort(Comparator.comparing(HabitRecord::getModifyT));
                habitRecord = records.removeLast();
                habitRecordRepository.deleteAll(records);
            } else {
                habitRecord = records.getFirst();
            }
        }
        habitRecord.setRecordValue(recordWrite.getRecordValue());
        habitRecord = habitRecordRepository.save(habitRecord);
        return getApiRecordFromRecord(habit, habitRecord);
    }

    public MultipartFile loadRecordResource(String uuid, String recordUuid, String resourcePath) {
        return null; //TODO implement
    }
}
