package com.manabandhu.backend.events;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatusOrderByStartAtAsc(String status);

    List<Event> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);

    List<Event> findByCategoryIdOrderByStartAtAsc(UUID categoryId);
}
