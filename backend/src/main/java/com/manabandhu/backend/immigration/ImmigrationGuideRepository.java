package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ImmigrationGuideRepository extends JpaRepository<ImmigrationGuide, UUID> {
    List<ImmigrationGuide> findAllByOrderByCreatedAtDesc();
    List<ImmigrationGuide> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ImmigrationGuide> findByCategoryOrderByCreatedAtDesc(String category);
}
