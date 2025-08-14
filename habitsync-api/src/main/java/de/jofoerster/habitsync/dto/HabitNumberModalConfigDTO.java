package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class HabitNumberModalConfigDTO {
    String habitUuid;
    List<String> values;
}
