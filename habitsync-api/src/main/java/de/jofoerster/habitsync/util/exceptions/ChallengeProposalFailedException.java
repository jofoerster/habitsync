package de.jofoerster.habitsync.util.exceptions;

public class ChallengeProposalFailedException extends RuntimeException {
    public ChallengeProposalFailedException(String s) {
        super("Challenge proposal failed: " + s);
    }
}
