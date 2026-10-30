package com.manabandhu.backend.events;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/events")
public class EventsController {

    private final EventsService service;

    EventsController(EventsService service) {
        this.service = service;
    }

    @GetMapping
    Page<Event> list(Authentication authentication, @RequestParam(required = false) String q, Pageable pageable) {
        return search(authentication, q, pageable);
    }

    @GetMapping("/search")
    Page<Event> search(Authentication authentication, @RequestParam(required = false) String q, Pageable pageable) {
        var viewer = Actor.from(authentication).orElse(null);
        var page = q != null && !q.isBlank() ? service.search(q, pageable) : service.findAll(pageable);
        return page.map(event -> event.viewedBy(viewer));
    }

    @GetMapping("/saved")
    List<Event> saved(Authentication authentication) {
        var actor = Actor.require(authentication);
        return service.findSaved(actor).stream().map(event -> event.viewedBy(actor)).toList();
    }

    @GetMapping("/mine")
    List<Event> mine(Authentication authentication) {
        var actor = Actor.require(authentication);
        return service.findMyEvents(actor.id()).stream().map(event -> event.viewedBy(actor)).toList();
    }

    @GetMapping("/{eventId}")
    Event detail(Authentication authentication, @PathVariable UUID eventId) {
        var viewer = Actor.from(authentication).orElse(null);
        return service.findById(eventId).map(event -> event.viewedBy(viewer))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Event not found"));
    }

    @PostMapping
    ResponseEntity<Event> create(Authentication authentication, @Valid @RequestBody CreateEventInput input) {
        var event = service.create(Actor.require(authentication).id(), input.title(), input.description(),
                input.location(), input.latitude(), input.longitude(),
                EventsService.parseInstant(input.startAt(), "startAt"), EventsService.parseInstant(input.endAt(), "endAt"),
                input.categoryId());
        return ResponseEntity.created(URI.create("/api/v1/events/" + event.getId()))
                .body(event.viewedBy(Actor.require(authentication)));
    }

    @PostMapping("/{eventId}/attendance")
    ResponseEntity<EventAttendance> attend(@PathVariable UUID eventId, Authentication authentication,
                                           @Valid @RequestBody CreateEventAttendanceInput input) {
        var attendance = service.attend(eventId, Actor.require(authentication).id(), input.status());
        return ResponseEntity.created(URI.create("/api/v1/events/" + eventId + "/attendance/" + attendance.getId())).body(attendance);
    }

    @GetMapping("/{eventId}/attendance")
    List<EventAttendance> attendance(Authentication authentication, @PathVariable UUID eventId) {
        return service.attendanceFor(Actor.require(authentication), eventId);
    }

    @GetMapping("/categories")
    List<EventCategory> categories() {
        return service.findCategories();
    }
}
