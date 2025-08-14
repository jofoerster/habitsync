package de.jofoerster.habitsync.model.habit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Data
@Builder
@Entity
@Table(name = "habit_records")
@AllArgsConstructor
public class HabitRecord {

    @Id
    @Column(unique = true)
    private String uuid;

    private String parentUuid;
    private Integer recordDate;
    private Integer recordType;
    private Double recordValue;
    private Long createT;
    private Long modifyT;
    private String reason;
    private String sessionId;

    public HabitRecord() {
        this.uuid = UUID.randomUUID()
                .toString();
        this.createT = System.currentTimeMillis() / 1000;
        this.modifyT = this.createT;
    }

    public LocalDate getRecordDateAsDate() {
        return LocalDate.ofEpochDay(recordDate);
    }

    public Double getRecordValue() {
        return recordValue != null ? recordValue : 0.0;
    }

    public void setRecordValue(Double recordValue) {
        this.recordValue = Objects.requireNonNullElse(recordValue, 0.0);
        this.modifyT = System.currentTimeMillis() / 1000;
    }
}