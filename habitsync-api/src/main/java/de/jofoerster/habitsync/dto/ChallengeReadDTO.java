package de.jofoerster.habitsync.dto;

import de.jofoerster.habitsync.model.challenge.ChallengeStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChallengeReadDTO {
    private Long id;
    private AccountReadDTO account;
    private ChallengeStatus status;

    private String title;
    private String description;

    private ComputationReadWriteDTO computation;

    private Long startDay; // as epoch day
    private Long endDay; // as epoch day

    private Integer votingScore; // used for sorting proposed challenges.
    // Higher when challenge is more popular. Challenge with the highest score will get active next month.

    private Boolean currentUserVote;

}
