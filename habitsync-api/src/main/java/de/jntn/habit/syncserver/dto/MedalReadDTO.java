package de.jntn.habit.syncserver.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class MedalReadDTO {
    String asciiCode;
    int amount;
    String color; // Hex color code
}
