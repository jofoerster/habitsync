package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class PercentageHistoryDTO {
    String month; // "YYYY-MM"
    Map<Integer, Double> dailyPercentages; // epochDay -> percentage
}
