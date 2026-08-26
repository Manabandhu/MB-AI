package com.manabandhu.backend.utilities;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface EmergencyResourceRepository extends JpaRepository<EmergencyResource, UUID> {
    List<EmergencyResource> findAllByOrderByCreatedAtDesc();
    List<EmergencyResource> findByCategoryOrderByNameAsc(String category);
}
