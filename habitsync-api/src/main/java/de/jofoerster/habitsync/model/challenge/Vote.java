package de.jofoerster.habitsync.model.challenge;

import de.jofoerster.habitsync.model.account.Account;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class Vote {
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne
    private Account account;
    @ManyToOne
    private Challenge challenge;
    private int voteValue;
}
