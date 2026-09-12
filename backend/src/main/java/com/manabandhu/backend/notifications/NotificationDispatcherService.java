package com.manabandhu.backend.notifications;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class NotificationDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcherService.class);
    private static final RestTemplate REST_TEMPLATE = new RestTemplate();

    private final NotificationService notificationService;
    private final String supabaseProjectUrl;
    private final String serviceRoleKey;

    NotificationDispatcherService(NotificationService notificationService,
                                  @org.springframework.beans.factory.annotation.Value("${app.supabase.project-url:}") String supabaseProjectUrl,
                                  @org.springframework.beans.factory.annotation.Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
        this.notificationService = notificationService;
        this.supabaseProjectUrl = supabaseProjectUrl;
        this.serviceRoleKey = serviceRoleKey;
    }

    @Scheduled(fixedDelayString = "${app.notifications.dispatch-interval-ms:60000}")
    public void dispatchDigests() {
        var pending = notificationService.findPendingDigests();
        for (var digest : pending) {
            try {
                sendPush(digest.getUserId(), digest.getTitle(), digest.getBody());
                digest.markDispatched();
                notificationService.save(digest);
            } catch (Exception exception) {
                log.warn("Failed to dispatch digest notification for user {}: {}", digest.getUserId(), exception.getMessage());
            }
        }
    }

    private void sendPush(UUID userId, String title, String body) {
        if (supabaseProjectUrl.isBlank() || serviceRoleKey.isBlank()) return;
        var url = supabaseProjectUrl + "/functions/v1/send-push-notification";
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        var payload = Map.of(
                "user_id", userId.toString(),
                "title", title,
                "body", body
        );
        REST_TEMPLATE.exchange(url, HttpMethod.POST, new HttpEntity<>(payload, headers), String.class);
    }
}
