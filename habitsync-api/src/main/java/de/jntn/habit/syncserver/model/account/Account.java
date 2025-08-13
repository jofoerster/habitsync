package de.jntn.habit.syncserver.model.account;

import de.jntn.habit.syncserver.dto.AccountReadDTO;
import de.jntn.habit.syncserver.model.notification.NotificationStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class Account {

    @Id
    private String authenticationId;

    private String userName;
    private String email;

    private String displayName;

    private Boolean enableInternalHabitTracker = true;

    private int notificationCreationHour = 20;
    private int notificationCreationFrequencyDays = 1;
    private boolean sendNotificationsViaEmail = false;
    private List<NotificationStatus> allowedNotifications;

    private AccountStatus accountStatus = AccountStatus.AWAITING_APPROVAL;

    public String getDisplayName() {
        return displayName != null && !displayName.isBlank() ? displayName : userName;
    }

    public String getName() {
        return getUserName();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Account account = (Account) o;
        if (getAuthenticationId() != null && account.getAuthenticationId() != null) {
            return getAuthenticationId().equals(account.getAuthenticationId());
        }
        return super.equals(o);
    }

    @Override
    public int hashCode() {
        return getAuthenticationId() != null ? getAuthenticationId().hashCode() : super.hashCode();
    }

    public AccountReadDTO getApiAccountRead() {
        return AccountReadDTO.builder()
                .authenticationId(this.getAuthenticationId())
                .email(this.getEmail())
                .displayName(this.getDisplayName())
                .build();
    }
}
