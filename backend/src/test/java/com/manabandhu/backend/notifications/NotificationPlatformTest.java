package com.manabandhu.backend.notifications;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

class NotificationPlatformTest {

    private final UUID alice = UUID.randomUUID();
    private final UUID bob = UUID.randomUUID();

    private static PlatformTransactionManager noopTransactions() {
        var manager = mock(PlatformTransactionManager.class);
        when(manager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        return manager;
    }

    // --- publisher

    @Test
    void publisherRespectsTheRecipientsCategoryToggle() {
        var service = mock(NotificationService.class);
        var settings = mock(NotificationsContentService.class);
        when(settings.allowsInApp(bob, "rideAlerts")).thenReturn(false);
        var publisher = new NotificationPublisher(service, settings, noopTransactions());

        publisher.publish(bob, alice, Notification.NotificationType.RIDE, "t", "b", "/rides/1");

        verify(service, never()).create(any(), any(), any(), any(), any());
    }

    @Test
    void publisherWritesWhenAllowedAndNeverNotifiesTheActor() {
        var service = mock(NotificationService.class);
        var settings = mock(NotificationsContentService.class);
        when(settings.allowsInApp(bob, "chatMessages")).thenReturn(true);
        var publisher = new NotificationPublisher(service, settings, noopTransactions());

        publisher.publishAll(List.of(alice, bob, bob), alice, Notification.NotificationType.CHAT, "New message", "b", "/chat/1");

        verify(service).create(eq(bob), eq("New message"), eq("b"), eq(Notification.NotificationType.CHAT), eq("/chat/1"));
        verify(service, never()).create(eq(alice), any(), any(), any(), any());
    }

    // --- settings and quiet hours

    private static Map<String, Object> quiet(String start, String end, String zone) {
        var settings = new HashMap<>(NotificationsContentService.DEFAULT_SETTINGS);
        settings.put("quietHours", true);
        settings.put("quietStart", start);
        settings.put("quietEnd", end);
        settings.put("timeZone", zone);
        return settings;
    }

    @Test
    void overnightQuietHoursDeferUntilMorning() {
        var at = Instant.parse("2026-10-11T04:30:00Z"); // 23:30 in Chicago (CDT)
        var until = NotificationsContentService.quietUntil(quiet("22:00", "07:00", "America/Chicago"), at);
        assertThat(until).isEqualTo(Instant.parse("2026-10-11T12:00:00Z"));
    }

    @Test
    void outsideQuietHoursPushesNow() {
        var at = Instant.parse("2026-10-11T18:00:00Z"); // 13:00 in Chicago
        assertThat(NotificationsContentService.quietUntil(quiet("22:00", "07:00", "America/Chicago"), at)).isNull();
        var off = new HashMap<>(NotificationsContentService.DEFAULT_SETTINGS);
        assertThat(NotificationsContentService.quietUntil(off, Instant.parse("2026-10-11T04:30:00Z"))).isNull();
    }

    @Test
    void malformedQuietHoursAreRejectedNotSilentlyDropped() {
        var jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForList(anyString(), eq(String.class), any(UUID.class))).thenReturn(List.of());
        var settings = new NotificationsContentService(jdbc);

        assertThatThrownBy(() -> settings.updateSettings(alice, new NotificationSettings(Map.of("quietStart", "25:00"))))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");
        assertThatThrownBy(() -> settings.updateSettings(alice, new NotificationSettings(Map.of("timeZone", "Mars/Base"))))
                .isInstanceOf(ResponseStatusException.class);

        var saved = settings.updateSettings(alice, new NotificationSettings(Map.of("quietHours", true, "quietStart", "21:30")));
        assertThat(saved.preferences()).containsEntry("quietHours", true).containsEntry("quietStart", "21:30");
    }

    // --- inbox

    @Test
    void readingSomeoneElsesNotificationIsForbidden() {
        var repository = mock(NotificationRepository.class);
        var notification = new Notification(bob, "t", "b", Notification.NotificationType.SYSTEM, null);
        when(repository.findById(notification.getId())).thenReturn(Optional.of(notification));
        var service = new NotificationService(repository);

        assertThatThrownBy(() -> service.markRead(new Actor(alice, false, false), notification.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
        assertThatThrownBy(() -> service.requireOwn(new Actor(alice, false, false), notification.getId()))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void inboxPagesAreCapped() {
        var repository = mock(NotificationRepository.class);
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(alice), any())).thenReturn(new PageImpl<>(List.of()));
        new NotificationService(repository).page(new Actor(alice, false, false), 0, 10_000);

        var captor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByUserIdOrderByCreatedAtDesc(eq(alice), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(NotificationService.MAX_PAGE_SIZE);
    }

    // --- devices

    @Test
    void devicesAcceptOnlyExpoTokensAndOnlyTheirOwnerRemovesThem() {
        var repository = mock(DeviceRegistrationRepository.class);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var devices = new DeviceTokenService(repository);
        var token = "ExponentPushToken[abcdefghijklmnop]";

        assertThatThrownBy(() -> devices.register(new Actor(alice, false, false), "https://evil.example", "ios"))
                .isInstanceOf(ResponseStatusException.class);
        var registration = devices.register(new Actor(alice, false, false), token, "iOS");
        assertThat(registration.getUserId()).isEqualTo(alice);

        when(repository.findByDeviceToken(token)).thenReturn(Optional.of(registration));
        assertThatThrownBy(() -> devices.unregister(new Actor(bob, false, false), token))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        verify(repository, never()).delete(any());
    }

    // --- dispatcher

    @Test
    void dispatcherHonoursPushOffAndQuietHours() {
        var service = mock(NotificationService.class);
        var settings = mock(NotificationsContentService.class);
        var devices = mock(DeviceTokenService.class);
        var muted = new Notification(alice, "t", "b", Notification.NotificationType.SYSTEM, null);
        var sleeping = new Notification(bob, "t", "b", Notification.NotificationType.SYSTEM, null);
        when(service.claimPending(anyInt())).thenReturn(List.of(muted, sleeping));
        when(settings.allowsPush(alice)).thenReturn(false);
        when(settings.allowsPush(bob)).thenReturn(true);
        var morning = Instant.now().plusSeconds(3600);
        when(settings.quietUntil(eq(bob), any())).thenReturn(morning);
        var dispatcher = new NotificationDispatcherService(service, settings, devices, mock(TransactionTemplate.class), true, "");

        assertThat(dispatcher.dispatchBatch()).isZero();

        assertThat(muted.isDispatched()).isTrue();
        assertThat(sleeping.isDispatched()).isFalse();
        verify(devices, never()).activeFor(any());
    }

    private static int anyInt() {
        return org.mockito.ArgumentMatchers.anyInt();
    }
}
