package com.manabandhu.backend.notifications;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
 * Sends push notifications for undispatched rows in small batches through the Expo push service. Rows are claimed
 * with row locks so multiple instances never double-send. Per notification it honours the recipient's settings:
 * push off → the row is closed without sending; quiet hours → the push waits until they end; no registered device
 * → closed without sending. Tokens Expo reports as unregistered are disabled.
 */
@Service
public class NotificationDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcherService.class);
    static final int BATCH_SIZE = 50;
    static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final NotificationService notificationService;
    private final NotificationSettingsService settings;
    private final DeviceTokenService devices;
    private final TransactionTemplate transactionTemplate;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String expoAccessToken;

    NotificationDispatcherService(NotificationService notificationService,
                                  NotificationSettingsService settings,
                                  DeviceTokenService devices,
                                  TransactionTemplate transactionTemplate,
                                  @Value("${app.notifications.push.enabled:false}") boolean enabled,
                                  @Value("${app.notifications.push.expo-access-token:}") String expoAccessToken) {
        this.notificationService = notificationService;
        this.settings = settings;
        this.devices = devices;
        this.transactionTemplate = transactionTemplate;
        this.enabled = enabled;
        this.expoAccessToken = expoAccessToken;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @Scheduled(fixedDelayString = "${app.notifications.dispatch-interval-ms:60000}")
    public void dispatchDigests() {
        // With push disabled, rows stay undispatched so they are delivered once it is switched on.
        if (!enabled) return;
        try {
            var sent = transactionTemplate.execute(status -> dispatchBatch());
            if (sent != null && sent > 0) log.info("notifications_dispatched count={}", sent);
        } catch (RuntimeException exception) {
            log.warn("Notification dispatch batch failed: {}", exception.getMessage());
        }
    }

    int dispatchBatch() {
        var sent = 0;
        var now = Instant.now();
        for (var notification : notificationService.claimPending(BATCH_SIZE)) {
            var userId = notification.getUserId();
            if (!settings.allowsPush(userId)) {
                notification.markDispatched();
                continue;
            }
            var quietUntil = settings.quietUntil(userId, now);
            if (quietUntil != null) {
                notification.deferDispatchUntil(quietUntil);
                continue;
            }
            var tokens = devices.activeFor(userId).stream().map(DeviceRegistration::getDeviceToken).toList();
            if (tokens.isEmpty()) {
                notification.markDispatched();
                continue;
            }
            try {
                sendPush(tokens, notification);
                notification.markDispatched();
                sent++;
            } catch (RuntimeException exception) {
                notification.recordDispatchFailure();
                log.warn("Failed to dispatch notification {} (attempt {}): {}", notification.getId(),
                        notification.getDispatchAttempts(), exception.getMessage());
            }
        }
        return sent;
    }

    @SuppressWarnings("unchecked")
    void sendPush(List<String> tokens, Notification notification) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (!expoAccessToken.isBlank()) headers.setBearerAuth(expoAccessToken);
        var messages = new ArrayList<Map<String, Object>>();
        for (var token : tokens) {
            var data = new HashMap<String, Object>();
            data.put("notificationId", notification.getId().toString());
            if (notification.getActionRoute() != null) data.put("route", notification.getActionRoute());
            messages.add(Map.of("to", token, "title", notification.getTitle(), "body", notification.getBody(),
                    "sound", "default", "data", data));
        }
        var response = restTemplate.exchange(EXPO_PUSH_URL, HttpMethod.POST, new HttpEntity<>(messages, headers), Map.class);
        var body = response.getBody();
        // Expo reports request-level failures (bad token format, auth, payload) as HTTP 200 with "errors".
        if (body == null || body.get("errors") != null) {
            throw new IllegalStateException("Expo push rejected: " + (body == null ? "empty response" : body.get("errors")));
        }
        if (body.get("data") instanceof List<?> tickets) {
            for (int i = 0; i < tickets.size() && i < tokens.size(); i++) {
                if (tickets.get(i) instanceof Map<?, ?> ticket && "error".equals(ticket.get("status"))
                        && ticket.get("details") instanceof Map<?, ?> details
                        && "DeviceNotRegistered".equals(details.get("error"))) {
                    devices.disable(tokens.get(i));
                }
            }
        }
    }
}
