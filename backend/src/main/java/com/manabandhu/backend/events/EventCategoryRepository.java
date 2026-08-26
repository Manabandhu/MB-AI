package com.manabandhu.backend.events;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface EventCategoryRepository extends JpaRepository<EventCategory, UUID> {
    List<EventCategory> findAllByOrderByNameAsc();
}
