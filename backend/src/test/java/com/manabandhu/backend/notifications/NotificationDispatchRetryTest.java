package com.manabandhu.backend.notifications;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class NotificationDispatchRetryTest {

    @Test
    void failedDispatchBacksOffAndCountsAttempts() {
        var notification = new Notification(UUID.randomUUID(), "Title", "Body", Notification.NotificationType.SYSTEM, null);

        notification.recordDispatchFailure();
        notification.recordDispatchFailure();

        assertThat(notification.getDispatchAttempts()).isEqualTo(2);
        assertThat(notification.isDispatched()).isFalse();
        var next = (Instant) ReflectionTestUtils.getField(notification, "nextDispatchAt");
        assertThat(next).isAfter(Instant.now().plus(Duration.ofMinutes(3)));
    }
}
