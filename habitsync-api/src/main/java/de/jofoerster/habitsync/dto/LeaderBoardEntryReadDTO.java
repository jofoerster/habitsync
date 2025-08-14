package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderBoardEntryReadDTO {
    AccountReadDTO account;
    Integer points;
}
