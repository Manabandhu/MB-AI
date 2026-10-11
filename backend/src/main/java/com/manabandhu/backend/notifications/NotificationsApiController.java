package com.manabandhu.backend.notifications;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsApiController {

    /** Channel names accepted by the legacy channel endpoints, mapped to settings keys. */
    private static final Map<String, String> CHANNEL_KEYS =
            Map.of("IN_APP", "inApp", "PUSH", "push", "EMAIL", "email", "SMS", "sms");

    record ChannelPreference(String channel, boolean enabled) {}

    record RegisterDeviceInput(@NotBlank @Size(max = 200) String token, @NotBlank @Size(max = 20) String platform) {}

    record RemoveDeviceInput(@NotBlank @Size(max = 200) String token) {}

    record DeviceView(UUID id, String platform, boolean enabled) {}

    private final NotificationService notificationService;
    private final NotificationsContentService settings;
    private final DeviceTokenService devices;

    NotificationsApiController(NotificationService notificationService, NotificationsContentService settings,
                               DeviceTokenService devices) {
        this.notificationService = notificationService;
        this.settings = settings;
        this.devices = devices;
    }

    /** The caller's newest notifications (at most 50); use {@code /inbox?page=} for more. */
    @GetMapping
    List<Notification> notifications(Authentication authentication) {
        return notificationService.page(Actor.require(authentication), 0, NotificationService.MAX_PAGE_SIZE).getContent();
    }

    @GetMapping("/unread-count")
    long unreadCount(Authentication authentication) {
        return notificationService.countUnread(Actor.require(authentication).id());
    }

    @PostMapping
    ResponseEntity<Notification> create(Authentication authentication, @Valid @RequestBody CreateNotificationRequest request) {
        // Notifications are produced by the system; only admins may create them by hand (for example to test push).
        Actor.require(authentication).requireAdmin();
        var type = Notification.NotificationType.valueOf(request.type());
        var notification = notificationService.create(Actor.require(authentication).id(), request.title(), request.body(), type, request.actionRoute());
        return ResponseEntity.created(URI.create("/api/v1/notifications/" + notification.getId())).body(notification);
    }

    @PostMapping("/{id}/read")
    ResponseEntity<NotificationDetail> markRead(Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(NotificationDetail.of(notificationService.markRead(Actor.require(authentication), id)));
    }

    @PostMapping("/read-all")
    Map<String, Integer> markAllRead(Authentication authentication) {
        return Map.of("updated", notificationService.markAllRead(Actor.require(authentication)));
    }

    /** Channel switches, read from the same settings the settings screen edits. */
    @GetMapping("/preferences")
    List<ChannelPreference> preferences(Authentication authentication) {
        var current = settings.settings(Actor.require(authentication).id()).preferences();
        return CHANNEL_KEYS.entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(e -> new ChannelPreference(e.getKey(), Boolean.TRUE.equals(current.get(e.getValue()))))
                .toList();
    }

    @PostMapping("/preferences")
    ChannelPreference setPreference(Authentication authentication, @Valid @RequestBody SetPreferenceRequest request) {
        var key = CHANNEL_KEYS.get(request.channel() == null ? "" : request.channel().toUpperCase(java.util.Locale.ROOT));
        if (key == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "channel must be one of IN_APP, PUSH, EMAIL, SMS");
        }
        settings.updateSettings(Actor.require(authentication).id(), new NotificationSettings(Map.of(key, request.enabled())));
        return new ChannelPreference(request.channel().toUpperCase(java.util.Locale.ROOT), request.enabled());
    }

    @PostMapping("/devices")
    DeviceView registerDevice(Authentication authentication, @Valid @RequestBody RegisterDeviceInput input) {
        var device = devices.register(Actor.require(authentication), input.token(), input.platform());
        return new DeviceView(device.getId(), device.getPlatform(), device.isEnabled());
    }

    /** POST with a body (not DELETE with a query string) so push tokens never land in access logs. */
    @PostMapping("/devices/remove")
    ResponseEntity<Void> unregisterDevice(Authentication authentication, @Valid @RequestBody RemoveDeviceInput input) {
        devices.unregister(Actor.require(authentication), input.token());
        return ResponseEntity.noContent().build();
    }
}
