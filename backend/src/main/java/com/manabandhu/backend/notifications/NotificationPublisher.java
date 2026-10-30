package com.manabandhu.backend.notifications;

import java.util.Collection;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * The one way modules create notifications. Called after a domain action (a ride request, a chat message, …);
 * the row is written only once the caller's transaction commits, in its own transaction, so a notification
 * never describes an action that rolled back and a notification failure never undoes the action.
 * The recipient's settings decide whether anything is written: {@code allNotifications}, {@code inApp} and the
 * category toggle. People are never notified about their own actions.
 */
@Service
public class NotificationPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationPublisher.class);
    private static final int MAX_TITLE = 200;
    private static final int MAX_BODY = 500;

    /** Category toggle (settings key) for each type; {@code null} means only the channel switches apply. */
    static String categoryKey(Notification.NotificationType type) {
        return switch (type) {
            case RIDE -> "rideAlerts";
            case ROOM -> "housingAlerts";
            case CHAT -> "chatMessages";
            case EXPENSE -> "expenseAlerts";
            case REFERRAL -> "referralAlerts";
            case JOB -> "jobAlerts";
            case EVENT, COMMUNITY -> "communityEvents";
            case SAFETY -> "safetyAlerts";
            case SYSTEM, AI -> null;
        };
    }

    private final NotificationService notificationService;
    private final NotificationSettingsService settings;
    private final TransactionTemplate newTransaction;

    NotificationPublisher(NotificationService notificationService, NotificationSettingsService settings,
                          PlatformTransactionManager transactionManager) {
        this.notificationService = notificationService;
        this.settings = settings;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void publish(UUID recipientId, UUID actorId, Notification.NotificationType type, String title, String body,
                        String route) {
        if (recipientId == null || recipientId.equals(actorId)) return;
        Runnable write = () -> write(recipientId, type, title, body, route);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    write.run();
                }
            });
        } else {
            write.run();
        }
    }

    public void publishAll(Collection<UUID> recipientIds, UUID actorId, Notification.NotificationType type,
                           String title, String body, String route) {
        recipientIds.stream().distinct().forEach(id -> publish(id, actorId, type, title, body, route));
    }

    private void write(UUID recipientId, Notification.NotificationType type, String title, String body, String route) {
        try {
            newTransaction.executeWithoutResult(status -> {
                if (!settings.allowsInApp(recipientId, categoryKey(type))) return;
                notificationService.create(recipientId, clip(title, MAX_TITLE), clip(body, MAX_BODY), type, route);
            });
        } catch (RuntimeException exception) {
            log.warn("notification_publish_failed type={} recipient={}: {}", type, recipientId, exception.getMessage());
        }
    }

    private static String clip(String value, int max) {
        var text = value == null ? "" : value.strip();
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }
}
