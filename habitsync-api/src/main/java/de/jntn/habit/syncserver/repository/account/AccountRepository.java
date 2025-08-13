package de.jntn.habit.syncserver.repository.account;

import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.account.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> getAccountsByAccountStatus(AccountStatus accountStatus);

    Optional<Account> getAccountByAuthenticationId(String authenticationId);

    List<Account> getAccountsBySendNotificationsViaEmail(boolean sendNotificationsViaEmail);
}
