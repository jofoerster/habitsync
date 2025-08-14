package de.jofoerster.habitsync.repository.habit;

import de.jofoerster.habitsync.model.habit.HabitRecord;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HabitRecordRepository extends JpaRepository<HabitRecord, Long> {
    long countByParentUuid(String parentUuid);

    List<HabitRecord> getHabitRecordsByParentUuidAndRecordDateGreaterThan(String parentUuid,
                                                                          Long recordDateIsGreaterThan);

    Long getHabitRecordsByParentUuidOrderByRecordDateDesc(String parentUuid, Limit limit);

    Optional<HabitRecord> findFirstByParentUuidOrderByRecordDateDesc(String uuid);

    Long countHabitRecordsByParentUuidAndRecordDateGreaterThan(String parentUuid, Long recordDateAfter);

    Long countRecordsByParentUuidAndRecordDateGreaterThan(String parentUuid, Long recordDateIsGreaterThan);

    List<HabitRecord> findHabitRecordsByParentUuidOrderByRecordDateDesc(String parentUuid, Pageable pageable);

    List<HabitRecord> getHabitRecordsByParentUuidAndRecordDateGreaterThanAndRecordDateLessThan(String parentUuid,
                                                                                               Long recordDateIsGreaterThan,
                                                                                               Long recordDateIsLessThan);

    Long countHabitRecordsByParentUuidAndRecordDateGreaterThanAndRecordValueGreaterThanEqual(String parentUuid,
                                                                                             Integer recordDateIsGreaterThan,
                                                                                             Double recordValueIsGreaterThan);

    List<HabitRecord> findHabitRecordByRecordDate(Integer recordDate);

    List<HabitRecord> findHabitRecordByRecordDateAndParentUuid(Integer recordDate, String parentUuid);

    List<HabitRecord> findHabitRecordByParentUuidAndRecordDate(String parentUuid, Integer recordDate);

    List<HabitRecord> findHabitRecordsByParentUuid(String parentUuid);

    List<HabitRecord> findHabitRecordsByParentUuidAndRecordDateBetween(String parentUuid, Integer recordDateAfter,
                                                                       Integer recordDateBefore);
}
