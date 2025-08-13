package de.jntn.habit.syncserver.model.challenge;


import de.jntn.habit.syncserver.model.account.Account;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ChallengeResult {

    @EmbeddedId
    private ChallengeResultId id;

    @ManyToOne
    @MapsId("accountId")
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne
    @MapsId("challengeId")
    @JoinColumn(name = "challenge_id")
    private Challenge challenge;

    private Double percentageReached;
    private Integer numberOfDaysReached;
    private Integer placement;

    public ChallengeResult(Account account, Challenge challenge, Double percentageReached, Integer numberOfDaysReached,
                           Integer placement) {
        this.id = new ChallengeResultId(account.getAuthenticationId(), challenge.getId());
        this.account = account;
        this.challenge = challenge;
        this.percentageReached = percentageReached;
        this.numberOfDaysReached = numberOfDaysReached;
        this.placement = placement;
    }
}
