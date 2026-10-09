package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ImmigrationResourceRepository extends JpaRepository<ImmigrationResource, UUID> {
    List<ImmigrationResource> findAllByOrderByCreatedAtDesc();
    List<ImmigrationResource> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ImmigrationResource> findByCategoryOrderByCreatedAtDesc(String category);

    long countByVerifiedTrue();

    long countByUrlContainingIgnoreCase(String fragment);

    @Query("SELECT COUNT(DISTINCT r.category) FROM ImmigrationResource r")
    long countDistinctCategories();
}
