package com.manabandhu.backend.events;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.Paging;

import jakarta.validation.Valid;

@Controller
public class EventsGraphqlController {

    private final EventsService service;

    EventsGraphqlController(EventsService service) {
        this.service = service;
    }

    @QueryMapping
    List<Event> events() {
        return service.findAll(Paging.firstPage(Paging.SHORT_LIST_CAP)).getContent();
    }

    @QueryMapping
    Event event(@Argument UUID id) {
        return service.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Event not found"));
    }

    @QueryMapping
    List<Event> savedEvents(Authentication authentication) {
        return service.findSaved(Actor.require(authentication));
    }

    @QueryMapping
    List<Event> myEvents(Authentication authentication) {
        return service.findMyEvents(Actor.require(authentication).id());
    }

    @MutationMapping
    Event createEvent(Authentication authentication, @Argument @Valid CreateEventInput input) {
        var startAt = EventsService.parseInstant(input.startAt(), "startAt");
        var endAt = EventsService.parseInstant(input.endAt(), "endAt");
        return service.create(Actor.require(authentication).id(), input.title(), input.description(),
                input.location(), input.latitude(), input.longitude(), startAt, endAt, input.categoryId());
    }

    @MutationMapping
    EventAttendance attendEvent(Authentication authentication, @Argument UUID eventId, @Argument @Valid CreateEventAttendanceInput input) {
        return service.attend(eventId, Actor.require(authentication).id(), input.status());
    }

    @QueryMapping
    List<EventCategory> eventCategories() {
        return service.findCategories();
    }

    @QueryMapping
    List<EventAttendance> eventAttendance(Authentication authentication, @Argument UUID eventId) {
        return service.attendanceFor(Actor.require(authentication), eventId);
    }

    /** Organizer ids stay private, as in REST; clients use {@code mine}. */
    @SchemaMapping(typeName = "Event", field = "organizerId")
    UUID organizerId(Event event) {
        return null;
    }

    @SchemaMapping(typeName = "Event", field = "mine")
    boolean mine(Event event, Authentication authentication) {
        return Actor.from(authentication).map(actor -> actor.is(event.getOrganizerId())).orElse(false);
    }
}
