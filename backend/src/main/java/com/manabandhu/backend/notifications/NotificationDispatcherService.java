package com.manabandhu.backend.notifications;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;

/**
 * Sends push notifications for undispatched rows in small batches. Rows are claimed with row locks so multiple
 * instances never double-send, and a row is only marked dispatched after the push provider accepted it.
 */
@Service
public class NotificationDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcherService.class);
    static final int BATCH_SIZE = 50;

    private final NotificationService notificationService;
    private final TransactionTemplate transactionTemplate;
    private final RestTemplate restTemplate;
    private final String supabaseProjectUrl;
    private final String serviceRoleKey;

    NotificationDispatcherService(NotificationService notificationService,
                                  TransactionTemplate transactionTemplate,
                                  @Value("${app.supabase.project-url:}") String supabaseProjectUrl,
                                  @Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
        this.notificationService = notificationService;
        this.transactionTemplate = transactionTemplate;
        this.supabaseProjectUrl = supabaseProjectUrl;
        this.serviceRoleKey = serviceRoleKey;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    boolean configured() {
        return !supabaseProjectUrl.isBlank() && !serviceRoleKey.isBlank();
    }

    @Scheduled(fixedDelayString = "${app.notifications.dispatch-interval-ms:60000}")
    public void dispatchDigests() {
        // Without a push provider, leave rows undispatched so they are delivered once one is configured.
        if (!configured()) return;
        try {
            var sent = transactionTemplate.execute(status -> dispatchBatch());
            if (sent != null && sent > 0) log.info("notifications_dispatched count={}", sent);
        } catch (RuntimeException exception) {
            log.warn("Notification dispatch batch failed: {}", exception.getMessage());
        }
    }

    private int dispatchBatch() {
        var sent = 0;
        for (var notification : notificationService.claimPending(BATCH_SIZE)) {
            try {
                sendPush(notification.getUserId(), notification.getTitle(), notification.getBody());
                notification.markDispatched();
                sent++;
            } catch (RuntimeException exception) {
                log.warn("Failed to dispatch notification {}: {}", notification.getId(), exception.getMessage());
            }
        }
        return sent;
    }

    private void sendPush(UUID userId, String title, String body) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        var payload = Map.of("user_id", userId.toString(), "title", title, "body", body);
        restTemplate.exchange(supabaseProjectUrl + "/functions/v1/send-push-notification",
                HttpMethod.POST, new HttpEntity<>(payload, headers), String.class);
    }
}
