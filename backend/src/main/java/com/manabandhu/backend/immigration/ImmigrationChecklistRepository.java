package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ImmigrationChecklistRepository extends JpaRepository<ImmigrationChecklist, UUID> {
    List<ImmigrationChecklist> findAllByOrderByCreatedAtDesc();
    List<ImmigrationChecklist> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ImmigrationChecklist> findByCategoryOrderByCreatedAtDesc(String category);
}
