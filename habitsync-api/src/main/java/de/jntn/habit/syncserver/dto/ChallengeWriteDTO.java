package de.jntn.habit.syncserver.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChallengeWriteDTO {
    private Long challengeId;
    private String title;
    private String description;

    private ComputationReadWriteDTO computation;
}
