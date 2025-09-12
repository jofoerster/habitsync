package de.jofoerster.habitsync.model.notification;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRuleStatus {
    @Id
    String ruleIdentifier;
    boolean isActive;
}
