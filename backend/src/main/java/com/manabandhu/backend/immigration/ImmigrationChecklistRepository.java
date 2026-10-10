package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface ImmigrationChecklistRepository extends JpaRepository<ImmigrationChecklist, UUID> {
    List<ImmigrationChecklist> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable page);
    List<ImmigrationChecklist> findByOwnerIdAndCategoryOrderByCreatedAtDesc(UUID ownerId, String category, Pageable page);

    long countByOwnerId(UUID ownerId);

    long countByOwnerIdAndCompletedAtIsNotNull(UUID ownerId);
}
