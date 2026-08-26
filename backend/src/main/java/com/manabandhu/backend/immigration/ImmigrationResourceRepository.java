package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ImmigrationResourceRepository extends JpaRepository<ImmigrationResource, UUID> {
    List<ImmigrationResource> findAllByOrderByCreatedAtDesc();
    List<ImmigrationResource> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ImmigrationResource> findByCategoryOrderByCreatedAtDesc(String category);
}
