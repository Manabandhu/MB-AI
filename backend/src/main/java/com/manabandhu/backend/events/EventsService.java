package com.manabandhu.backend.events;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class EventsService {

    private final EventRepository eventRepository;
    private final EventAttendanceRepository attendanceRepository;
    private final EventCategoryRepository categoryRepository;

    EventsService(EventRepository eventRepository, EventAttendanceRepository attendanceRepository,
                  EventCategoryRepository categoryRepository) {
        this.eventRepository = eventRepository;
        this.attendanceRepository = attendanceRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<Event> findAll(Pageable pageable) {
        return eventRepository.findByStatusOrderByStartAtAsc("published", pageable);
    }

    @Transactional(readOnly = true)
    public Page<Event> search(String q, Pageable pageable) {
        return eventRepository.searchPublished("published", q, pageable);
    }

    @Transactional(readOnly = true)
    public List<Event> findSaved() {
        return eventRepository.findByStatusOrderByStartAtAsc("saved");
    }

    @Transactional(readOnly = true)
    public List<Event> findMyEvents(UUID organizerId) {
        return eventRepository.findByOrganizerIdOrderByCreatedAtDesc(organizerId);
    }

    @Transactional(readOnly = true)
    public Optional<Event> findById(UUID id) {
        return eventRepository.findById(id);
    }

    @Transactional
    public Event create(UUID organizerId, String title, String description, String location, java.math.BigDecimal latitude,
                        java.math.BigDecimal longitude, java.time.Instant startAt, java.time.Instant endAt,
                        UUID categoryId) {
        return eventRepository.save(new Event(organizerId, title, description, location, latitude, longitude,
                startAt, endAt, categoryId, "published"));
    }

    @Transactional
    public EventAttendance attend(UUID eventId, UUID userId, String status) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        // One attendance row per user and event: re-RSVPs update the existing row.
        var existing = attendanceRepository.findByEventIdAndUserId(eventId, userId);
        if (existing.isPresent()) {
            existing.get().setStatus(status);
            return attendanceRepository.save(existing.get());
        }
        return attendanceRepository.save(new EventAttendance(eventId, userId, status));
    }

    @Transactional(readOnly = true)
    public List<EventCategory> findCategories() {
        return categoryRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<EventAttendance> findAttendance(UUID eventId) {
        return attendanceRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    /** The organizer and admins see the full guest list; everyone else sees only their own RSVP. */
    @Transactional(readOnly = true)
    public List<EventAttendance> attendanceFor(Actor actor, UUID eventId) {
        var event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (actor.admin() || actor.is(event.getOrganizerId())) {
            return attendanceRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        }
        return attendanceRepository.findByEventIdAndUserId(eventId, actor.id()).map(List::of).orElse(List.of());
    }
}
