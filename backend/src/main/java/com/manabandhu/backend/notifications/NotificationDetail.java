package com.manabandhu.backend.notifications;

/** A notification as shown in the inbox; {@code meta} carries the type and an optional in-app route. */
public record NotificationDetail(String id, String title, String body, String meta, boolean read, String route,
                                 String createdAt) {

    static NotificationDetail of(Notification notification) {
        return new NotificationDetail(notification.getId().toString(), notification.getTitle(), notification.getBody(),
                notification.getType().name(), notification.isRead(), notification.getActionRoute(),
                notification.getCreatedAt().toString());
    }
}
