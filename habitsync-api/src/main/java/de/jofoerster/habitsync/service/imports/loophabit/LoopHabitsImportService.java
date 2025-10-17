package de.jofoerster.habitsync.service.imports.loophabit;


import de.jofoerster.habitsync.dto.ComputationReadWriteDTO;
import de.jofoerster.habitsync.dto.FrequencyTypeDTO;
import de.jofoerster.habitsync.dto.HabitRecordWriteDTO;
import de.jofoerster.habitsync.dto.HabitWriteDTO;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.service.habit.CachingHabitRecordService;
import de.jofoerster.habitsync.service.habit.HabitService;
import de.jofoerster.habitsync.service.imports.SqliteImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoopHabitsImportService {

    private final HabitService habitService;
    private final CachingHabitRecordService cachingHabitRecordService;
    private final SqliteImportService sqliteImportService;

    public void importFromDb(MultipartFile file, Account account) throws IOException {
        log.info("Starting import from Loop Habits db file: {}", file.getOriginalFilename());

        String habitQuery = """
                 SELECT id, archived, color, description, freq_den, freq_num, highlight,\s
                 name, position, type, target_type, target_value, unit, uuid from Habits;\s
                \s""";

        String checkmarkQuery = """
                 SELECT id, habit, timestamp, value, notes from Repetitions WHERE habit = %d;\s
                \s""";

        try {
            List habits = sqliteImportService.importSqliteData(file, habitQuery);
            for (Object habit : habits) {
                Map mapHabits = (Map) habit;
                List checkmarks = sqliteImportService.importSqliteData(
                        file, String.format(checkmarkQuery, mapHabits.get("id")));
                processHabits(mapHabits, checkmarks, account);
            }
        } catch (SQLException e) {
            log.error("SQL error during import from Loop Habits", e);
            throw new IOException("Failed to process Loop Habits database file", e);
        }
    }

    private void processHabits(Map habitMap, List checkmarks,
                               Account account) {
        log.debug("Processing habit: {} with {} checkmarks", habitMap.get("name"), checkmarks.size());

        boolean isYesNoHabit = ((int) habitMap.get("type")) == 0;

        ComputationReadWriteDTO computationReadWriteDTO = ComputationReadWriteDTO.builder()
                .frequency((Integer) habitMap.get("freq_num"))
                .timesPerXDays((Integer) habitMap.get("freq_den"))
                .frequencyType(
                        getFrequencyType((int) habitMap.get(("freq_den")), isYesNoHabit))
                .isNegative(((int) habitMap.get("target_type")) == 1)
                .targetDays(30)
                .unit((String) habitMap.get("unit"))
                .dailyReachableValue(getDailyReachableValue((double) habitMap.get("target_value")))
                .dailyDefault(String.valueOf(1))
                .build();

        HabitWriteDTO habitWriteDTO = HabitWriteDTO
                .builder()
                .name(habitMap.get("name").toString())
                .progressComputation(computationReadWriteDTO)
                .build();

        Optional<Habit> habitCreated =
                habitService.getHabitByUuid(habitService.createNewHabit(habitWriteDTO, account).getUuid());

        if (habitCreated.isEmpty()) {
            log.error("Failed to create habit: {}", habitWriteDTO.getName());
            return;
        }

        for (Object checkmark : checkmarks) {
            Map checkmarkMap = (Map) checkmark;
            log.debug("Checkmark - Date: {}, Value: {}", checkmarkMap.get("timestamp"), checkmarkMap.get("value"));
            cachingHabitRecordService.createRecord(habitCreated.get(), HabitRecordWriteDTO
                    .builder()
                    .recordValue(getRecordValue((Integer) checkmarkMap.get("value")))
                    .epochDay(getEpochDay((Long) checkmarkMap.get("timestamp")))
                    .build());
        }
    }

    private Double getDailyReachableValue(double targetValue) {
        return targetValue == 0 ? 1.0 : (double) targetValue;
    }

    private double getRecordValue(int recordValueLoop) {
        if (recordValueLoop == 0 || recordValueLoop == -1 || recordValueLoop == 3) {
            return 0;
        } else if (recordValueLoop == 2) {
            return 1;
        } else if (recordValueLoop >= 1000) {
            return recordValueLoop / 1000.0;
        } else {
            return recordValueLoop;
        }
        // 2: fullfilled
        // 3: skipped ??? -> does not exist in HabitSync
        // 0: not fullfilled
    }

    private int getEpochDay(long unixTimestamp) {
        LocalDateTime localDateTime = LocalDateTime.ofEpochSecond(unixTimestamp / 1000, 0, ZoneOffset.UTC);
        return (int) localDateTime.toLocalDate().toEpochDay();
    }

    private FrequencyTypeDTO getFrequencyType(int freqDen, boolean isYesNoHabit) {
       if (isYesNoHabit) {
           return FrequencyTypeDTO.X_TIMES_PER_Y_DAYS;
       } else {
           if (freqDen == 7) {
               return FrequencyTypeDTO.WEEKLY;
           } else if (freqDen == 1) {
               return FrequencyTypeDTO.X_TIMES_PER_Y_DAYS;
           } else {
               return FrequencyTypeDTO.MONTHLY;
           }
       }
    }

}

