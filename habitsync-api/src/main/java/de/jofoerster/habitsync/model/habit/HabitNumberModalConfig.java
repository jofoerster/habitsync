package de.jofoerster.habitsync.model.habit;

import de.jofoerster.habitsync.dto.HabitNumberModalConfigDTO;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Entity
@Data
public class HabitNumberModalConfig {

    @Id
    String habitUuid;

    String configValues = "";

    private final String STRING_DELIMITER = ";";

    public void addConfigValue(String configValue) {
        if (configValue.contains(STRING_DELIMITER)) {
            throw new IllegalArgumentException("Config value cannot contain semicolons.");
        }
        configValues = configValues + ";" + configValue;
    }

    public void removeConfigValue(String configValue) {
        List<String> configValuesList = getConfigValues();
        configValuesList.remove(configValue);
        configValues = String.join(STRING_DELIMITER, configValuesList);
    }

    public List<String> getConfigValues() {
        return new ArrayList<>(
                Arrays.stream(configValues.split(STRING_DELIMITER)).filter(e -> !e.isBlank()).toList());
    }

    public HabitNumberModalConfigDTO getApiHabitNumberModalConfig() {
        return HabitNumberModalConfigDTO.builder()
                .habitUuid(habitUuid)
                .values(getConfigValues())
                .build();
    }
}
