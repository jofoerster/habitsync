package de.jofoerster.habitsync.repository.account;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.account.AccountStatus;
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
