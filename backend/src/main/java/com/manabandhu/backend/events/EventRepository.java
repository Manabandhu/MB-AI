package com.manabandhu.backend.events;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatusOrderByStartAtAsc(String status);

    List<Event> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);

    List<Event> findByCategoryIdOrderByStartAtAsc(UUID categoryId);

    Page<Event> findByStatusOrderByStartAtAsc(String status, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status = :status AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.location) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Event> searchPublished(@Param("status") String status, @Param("query") String query, Pageable pageable);
}
