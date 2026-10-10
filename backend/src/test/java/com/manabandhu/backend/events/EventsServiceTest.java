package com.manabandhu.backend.events;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class EventsServiceTest {

    @Test
    void createEvent() {
        var eventRepo = mock(EventRepository.class);
        var attendanceRepo = mock(EventAttendanceRepository.class);
        var categoryRepo = mock(EventCategoryRepository.class);
        when(eventRepo.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new EventsService(eventRepo, attendanceRepo, categoryRepo);
        var organizerId = UUID.randomUUID();
        var categoryId = UUID.randomUUID();
        var startAt = Instant.now().plusSeconds(86400);
        var endAt = startAt.plusSeconds(3600);
        var event = service.create(organizerId, "Community Meetup", "Monthly gathering", "Irving",
                BigDecimal.valueOf(32.8), BigDecimal.valueOf(-96.9), startAt, endAt, categoryId);

        assertThat(event).isNotNull();
        assertThat(event.getOrganizerId()).isEqualTo(organizerId);
        assertThat(event.getTitle()).isEqualTo("Community Meetup");
        assertThat(event.getStatus()).isEqualTo("published");
        verify(eventRepo).save(any(Event.class));
    }

    @Test
    void attendEvent() {
        var eventRepo = mock(EventRepository.class);
        var attendanceRepo = mock(EventAttendanceRepository.class);
        var categoryRepo = mock(EventCategoryRepository.class);
        when(attendanceRepo.save(any(EventAttendance.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new EventsService(eventRepo, attendanceRepo, categoryRepo);
        var eventId = UUID.randomUUID();
        when(eventRepo.existsById(eventId)).thenReturn(true);
        var attendance = service.attend(eventId, UUID.randomUUID(), "GOING");

        assertThat(attendance).isNotNull();
        assertThat(attendance.getEventId()).isEqualTo(eventId);
        assertThat(attendance.getStatus()).isEqualTo("going");
        verify(attendanceRepo).save(any(EventAttendance.class));
    }

    @Test
    void findCategories() {
        var eventRepo = mock(EventRepository.class);
        var attendanceRepo = mock(EventAttendanceRepository.class);
        var categoryRepo = mock(EventCategoryRepository.class);
        when(categoryRepo.findAllByOrderByNameAsc()).thenReturn(List.of());
        var service = new EventsService(eventRepo, attendanceRepo, categoryRepo);

        var categories = service.findCategories();
        assertThat(categories).isEmpty();
        verify(categoryRepo).findAllByOrderByNameAsc();
    }

    @Test
    void savedEventsAreScopedToTheCaller() {
        var eventRepo = mock(EventRepository.class);
        var service = new EventsService(eventRepo, mock(EventAttendanceRepository.class), mock(EventCategoryRepository.class));
        var caller = new com.manabandhu.backend.auth.Actor(UUID.randomUUID(), false, false);
        when(eventRepo.findSavedByUser(org.mockito.ArgumentMatchers.eq(caller.id()), any(), any())).thenReturn(List.of());

        assertThat(service.findSaved(caller)).isEmpty();

        verify(eventRepo).findSavedByUser(org.mockito.ArgumentMatchers.eq(caller.id()), any(), any());
        org.mockito.Mockito.verify(eventRepo, org.mockito.Mockito.never()).findByStatusOrderByStartAtAsc("saved");
    }

    @Test
    void malformedTimestampsAreBadRequests() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> EventsService.parseInstant("next tuesday", "startAt"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void endMustFollowStart() {
        var service = new EventsService(mock(EventRepository.class), mock(EventAttendanceRepository.class), mock(EventCategoryRepository.class));
        var start = Instant.now().plusSeconds(3600);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.create(UUID.randomUUID(), "t", null, "Irving",
                        null, null, start, start.minusSeconds(60), null))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void unknownAttendanceStatusIsRejected() {
        var eventRepo = mock(EventRepository.class);
        var attendanceRepo = mock(EventAttendanceRepository.class);
        var service = new EventsService(eventRepo, attendanceRepo, mock(EventCategoryRepository.class));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.attend(UUID.randomUUID(), UUID.randomUUID(), "organizer"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        org.mockito.Mockito.verifyNoInteractions(attendanceRepo);
    }
}
