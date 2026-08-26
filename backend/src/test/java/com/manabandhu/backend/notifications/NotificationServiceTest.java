package com.manabandhu.backend.notifications;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    NotificationRepository repository;

    @InjectMocks
    NotificationService service;

    @Test
    void countUnreadReturnsCount() {
        var userId = UUID.randomUUID();
        when(repository.countByUserIdAndReadFalse(userId)).thenReturn(2L);
        assertThat(service.countUnread(userId)).isEqualTo(2);
        verify(repository).countByUserIdAndReadFalse(userId);
    }

    @Test
    void markReadUpdatesNotification() {
        var notification = new Notification(UUID.randomUUID(), "Title", "Body", Notification.NotificationType.SYSTEM, null);
        when(repository.findById(notification.getId())).thenReturn(Optional.of(notification));
        var updated = service.markRead(notification.getId());
        assertThat(updated.isRead()).isTrue();
        assertThat(updated.getReadAt()).isNotNull();
    }
}
