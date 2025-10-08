package de.jofoerster.habitsync.model.account;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Set;

@Entity
@Data
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Account account;

    private String hashedKey;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "api_key_authorities", joinColumns = @JoinColumn(name = "api_key_id"))
    @Column(name = "authority")
    private Set<String> authorities; // e.g., "ROLE_USER", "READ_ONLY"
}
