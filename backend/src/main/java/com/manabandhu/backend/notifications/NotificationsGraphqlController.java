package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class NotificationsGraphqlController {

    private final NotificationService notificationService;
    private final NotificationPreferenceService preferenceService;

    NotificationsGraphqlController(NotificationService notificationService, NotificationPreferenceService preferenceService) {
        this.notificationService = notificationService;
        this.preferenceService = preferenceService;
    }

    @QueryMapping
    List<Notification> notifications(Authentication authentication) {
        return notificationService.findByUser(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    Notification createNotification(Authentication authentication, @Argument @Valid CreateNotificationRequest input) {
        var type = Notification.NotificationType.valueOf(input.type());
        return notificationService.create(UUID.fromString(authentication.getName()), input.title(), input.body(), type, input.actionRoute());
    }

    @MutationMapping
    Notification markNotificationRead(@Argument UUID id) {
        return notificationService.markRead(id);
    }

    @QueryMapping
    List<NotificationPreference> notificationPreferences(Authentication authentication) {
        return preferenceService.findByUser(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    NotificationPreference setNotificationPreference(Authentication authentication, @Argument @Valid SetPreferenceRequest input) {
        var channel = NotificationPreference.Channel.valueOf(input.channel());
        return preferenceService.set(UUID.fromString(authentication.getName()), channel, input.enabled());
    }
}
