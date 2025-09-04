package de.jofoerster.habitsync.service.habit;

import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitRecord;
import de.jofoerster.habitsync.dto.HabitRecordReadDTO;
import de.jofoerster.habitsync.dto.HabitRecordWriteDTO;
import de.jofoerster.habitsync.model.habit.HabitRecordCompletion;
import de.jofoerster.habitsync.repository.habit.HabitRecordRepository;
import de.jofoerster.habitsync.repository.habit.HabitRecordSupplier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class HabitRecordService {
    private final HabitRecordRepository habitRecordRepository;
    private final HabitService habitService;

    private HabitRecordCompletion getHabitRecordStatus(HabitRecord habitRecord) {
        Optional<Habit> habitOpt = habitService.getHabitByUuid(habitRecord.getParentUuid());
        boolean completion = habitOpt.map(
                        h -> h.getCompletionForDay(new HabitRecordSupplier(habitRecordRepository), habitRecord.getRecordDate()))
                .orElse(false);
        if (habitOpt.isPresent() && habitOpt.get().getDailyGoal() != null &&
                habitRecord.getRecordValue() >= habitOpt.get().getDailyGoal()) {
            return HabitRecordCompletion.COMPLETED;
        } else if (completion) {
            return HabitRecordCompletion.COMPLETED_BY_OTHER_RECORDS;
        }
        return habitRecord.getRecordValue() > 0
                ? HabitRecordCompletion.PARTIALLY_COMPLETED
                : HabitRecordCompletion.MISSED;
    }

    public HabitRecordReadDTO getApiRecordFromRecord(HabitRecord habitRecord) {
        return HabitRecordReadDTO.builder()
                .uuid(habitRecord.getUuid())
                .habitUuid(habitRecord.getParentUuid())
                .epochDay(habitRecord.getRecordDate())
                .recordValue(habitRecord.getRecordValue())
                .completion(getHabitRecordStatus(habitRecord))
                .build();
    }

    public List<HabitRecordReadDTO> getRecords(String habitUuid, Integer epochDayFrom, Integer epochDayTo) {
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordsByParentUuidAndRecordDateBetween(habitUuid, epochDayFrom,
                        epochDayTo);
        for (Integer day = epochDayFrom; day <= epochDayTo; day++) {
            Integer finalRecord = day;
            if (records.stream().noneMatch(r -> r.getRecordDate().equals(finalRecord))) {
                records.add(HabitRecord.builder()
                        .parentUuid(habitUuid)
                        .recordValue(0d)
                        .recordDate(day).build());
            }
        }
        return records.stream().map(this::getApiRecordFromRecord).toList();
    }

    public HabitRecordReadDTO createRecord(String habitUuid, HabitRecordWriteDTO recordWrite) {
        List<HabitRecord> records =
                habitRecordRepository.findHabitRecordByRecordDateAndParentUuid(recordWrite.getEpochDay(), habitUuid);
        HabitRecord habitRecord;
        if (records.isEmpty()) {
            habitRecord = new HabitRecord();
            habitRecord.setParentUuid(habitUuid);
            habitRecord.setRecordDate(recordWrite.getEpochDay());
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
        return getApiRecordFromRecord(habitRecord);
    }

    public MultipartFile loadRecordResource(String uuid, String recordUuid, String resourcePath) {
        return null; //TODO implement
    }
}
