package com.manabandhu.backend.notifications;

import java.util.List;

/** One page of the inbox plus the total unread count for the badge. */
public record NotificationInbox(List<NotificationDetail> items, int page, boolean hasMore, long unreadCount) {}
