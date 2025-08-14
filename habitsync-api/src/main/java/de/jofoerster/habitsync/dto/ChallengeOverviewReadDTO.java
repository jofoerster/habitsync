package de.jofoerster.habitsync.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChallengeOverviewReadDTO {
    private ChallengeReadDTO activeChallenge;
    private List<ChallengeReadDTO> proposedChallenges;
    private List<ChallengeReadDTO> createdChallenges;
    private List<LeaderBoardEntryReadDTO> leaderboard; //account -> points
    private List<ChallengeProgressReadDTO> progressCurrentChallengeUsers;
}
