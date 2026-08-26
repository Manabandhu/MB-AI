package com.manabandhu.backend.events;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
public class EventsController {

    private final EventsService service;

    EventsController(EventsService service) {
        this.service = service;
    }

    @GetMapping
    List<Event> list(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return service.findAll().stream()
                    .filter(e -> e.getTitle().toLowerCase().contains(q.toLowerCase())
                            || e.getLocation().toLowerCase().contains(q.toLowerCase()))
                    .toList();
        }
        return service.findAll();
    }

    @GetMapping("/saved")
    List<Event> saved() {
        return service.findSaved();
    }

    @GetMapping("/mine")
    List<Event> mine(Authentication authentication) {
        return service.findMyEvents(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/{eventId}")
    Event detail(@PathVariable UUID eventId) {
        return service.findById(eventId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Event not found"));
    }

    @PostMapping
    ResponseEntity<Event> create(Authentication authentication, @Valid @RequestBody CreateEventInput input) {
        var event = service.create(UUID.fromString(authentication.getName()), input.title(), input.description(),
                input.location(), input.latitude(), input.longitude(),
                java.time.Instant.parse(input.startAt()), java.time.Instant.parse(input.endAt()),
                input.categoryId());
        return ResponseEntity.created(URI.create("/api/v1/events/" + event.getId())).body(event);
    }

    @PostMapping("/{eventId}/attendance")
    ResponseEntity<EventAttendance> attend(@PathVariable UUID eventId, Authentication authentication,
                                           @Valid @RequestBody CreateEventAttendanceInput input) {
        var attendance = service.attend(eventId, UUID.fromString(authentication.getName()), input.status());
        return ResponseEntity.created(URI.create("/api/v1/events/" + eventId + "/attendance/" + attendance.getId())).body(attendance);
    }

    @GetMapping("/{eventId}/attendance")
    List<EventAttendance> attendance(@PathVariable UUID eventId) {
        return service.findAttendance(eventId);
    }

    @GetMapping("/categories")
    List<EventCategory> categories() {
        return service.findCategories();
    }
}
