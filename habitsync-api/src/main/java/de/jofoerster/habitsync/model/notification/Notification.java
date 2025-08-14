package de.jofoerster.habitsync.model.notification;

import de.jofoerster.habitsync.model.account.Account;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Account receiverAccount;
    @ManyToOne
    private Account senderAccount;
    private NotificationStatus status = NotificationStatus.WAITING;
    private LocalDateTime timestamp = LocalDateTime.now();
    @Column(columnDefinition = "TEXT")
    private String content;
    @Column(columnDefinition = "TEXT")
    private String htmlContentShade;
    @Column(columnDefinition = "TEXT")
    private String htmlContentShadeMinimal;
    @Column(columnDefinition = "TEXT")
    private String subject;

    //to check if notification belong to the same shared habit
    private Long sharedHabitIt;
    //for checking if notifications are duplicates of each other:
    private int identifier;
}
