package de.jntn.habit.syncserver.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderBoardEntryReadDTO {
    AccountReadDTO account;
    Integer points;
}
