package com.manabandhu.backend.notifications;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * The caller's inbox, read state, settings, and push devices. Every route acts on the signed-in member's own data;
 * ownership is checked in {@link NotificationService} and {@link DeviceTokenService}.
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsController {

    record RegisterDeviceInput(@NotBlank @Size(max = 200) String token, @NotBlank @Size(max = 20) String platform) {}

    record RemoveDeviceInput(@NotBlank @Size(max = 200) String token) {}

    record DeviceView(UUID id, String platform, boolean enabled) {}

    private final NotificationService notificationService;
    private final NotificationSettingsService settings;
    private final DeviceTokenService devices;

    NotificationsController(NotificationService notificationService, NotificationSettingsService settings,
                            DeviceTokenService devices) {
        this.notificationService = notificationService;
        this.settings = settings;
        this.devices = devices;
    }

    /** One page of the caller's notifications, newest first (size capped at 50). */
    @GetMapping("/inbox")
    NotificationInbox inbox(Authentication authentication,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "20") int size) {
        var actor = Actor.require(authentication);
        var result = notificationService.page(actor, page, size);
        return new NotificationInbox(result.getContent().stream().map(NotificationDetail::of).toList(),
                result.getNumber(), result.hasNext(), notificationService.countUnread(actor.id()));
    }

    @GetMapping("/unread-count")
    long unreadCount(Authentication authentication) {
        return notificationService.countUnread(Actor.require(authentication).id());
    }

    /** Only the recipient can open a notification; opening it does not mark it read (use POST /{id}/read). */
    @GetMapping("/{id}")
    NotificationDetail detail(Authentication authentication, @PathVariable UUID id) {
        return NotificationDetail.of(notificationService.requireOwn(Actor.require(authentication), id));
    }

    /** Notifications are produced by the system; only admins may create one by hand (for example to test push). */
    @PostMapping
    ResponseEntity<Notification> create(Authentication authentication, @Valid @RequestBody CreateNotificationRequest request) {
        var actor = Actor.require(authentication);
        actor.requireAdmin();
        var type = Notification.NotificationType.valueOf(request.type());
        var notification = notificationService.create(actor.id(), request.title(), request.body(), type, request.actionRoute());
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

    @GetMapping("/settings")
    ResponseEntity<NotificationSettings> settings(Authentication authentication) {
        return ResponseEntity.ok(settings.settings(Actor.require(authentication).id()));
    }

    @PatchMapping("/settings")
    ResponseEntity<NotificationSettings> updateSettings(Authentication authentication, @RequestBody NotificationSettings update) {
        return ResponseEntity.ok(settings.updateSettings(Actor.require(authentication).id(), update));
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
