package com.manabandhu.backend.events;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class EventsGraphqlController {

    private final EventsService service;

    EventsGraphqlController(EventsService service) {
        this.service = service;
    }

    @QueryMapping
    List<Event> events() {
        return service.findAll(Pageable.unpaged()).getContent();
    }

    @QueryMapping
    Event event(@Argument UUID id) {
        return service.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Event not found"));
    }

    @QueryMapping
    List<Event> savedEvents() {
        return service.findSaved();
    }

    @QueryMapping
    List<Event> myEvents(Authentication authentication) {
        return service.findMyEvents(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    Event createEvent(Authentication authentication, @Argument @Valid CreateEventInput input) {
        var startAt = java.time.Instant.parse(input.startAt());
        var endAt = java.time.Instant.parse(input.endAt());
        return service.create(UUID.fromString(authentication.getName()), input.title(), input.description(),
                input.location(), input.latitude(), input.longitude(), startAt, endAt, input.categoryId());
    }

    @MutationMapping
    EventAttendance attendEvent(Authentication authentication, @Argument UUID eventId, @Argument @Valid CreateEventAttendanceInput input) {
        return service.attend(eventId, UUID.fromString(authentication.getName()), input.status());
    }

    @QueryMapping
    List<EventCategory> eventCategories() {
        return service.findCategories();
    }

    @QueryMapping
    List<EventAttendance> eventAttendance(@Argument UUID eventId) {
        return service.findAttendance(eventId);
    }
}
