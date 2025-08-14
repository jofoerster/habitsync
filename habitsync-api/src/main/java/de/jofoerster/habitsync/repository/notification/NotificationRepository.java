package de.jofoerster.habitsync.repository.notification;

import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.notification.Notification;
import de.jofoerster.habitsync.model.notification.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> getAllNotificationsFilteredByStatus(NotificationStatus status);

    List<Notification> getNotificationByReceiverAccount(Account currentAccount);

    int countNotificationsFilteredByReceiverAccountAndStatusIn(Account receiverAccount,
                                                               Collection<NotificationStatus> statuses);

    List<Notification> findAllByReceiverAccount(Account receiverAccount);

    List<Notification> getNotificationByReceiverAccountAndStatusIn(Account receiverAccount,
                                                                   List<NotificationStatus> status);

    List<Notification> getNotificationByIdentifier(int identifier);

    List<Notification> getNotificationsByIdentifierOrderByTimestampAsc(int identifier);

    List<Notification> getAllNotificationsFilteredByStatusAndReceiverAccount(NotificationStatus status,
                                                                             Account receiverAccount);
}
