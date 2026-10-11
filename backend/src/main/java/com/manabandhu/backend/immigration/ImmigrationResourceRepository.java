package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ImmigrationResourceRepository extends JpaRepository<ImmigrationResource, UUID> {
    List<ImmigrationResource> findAllByOrderByCreatedAtDesc();

    List<ImmigrationResource> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable page);

    List<ImmigrationResource> findByCategoryOrderByCreatedAtDesc(String category, org.springframework.data.domain.Pageable page);

    @org.springframework.data.jpa.repository.Query("""
            SELECT r FROM ImmigrationResource r
            WHERE (r.verified = true OR (:callerId IS NOT NULL AND r.ownerId = :callerId))
              AND (:category IS NULL OR r.category = :category)
            ORDER BY r.createdAt DESC""")
    List<ImmigrationResource> findVisible(@org.springframework.data.repository.query.Param("callerId") UUID callerId,
                                          @org.springframework.data.repository.query.Param("category") String category,
                                          org.springframework.data.domain.Pageable page);
    List<ImmigrationResource> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ImmigrationResource> findByCategoryOrderByCreatedAtDesc(String category);

    long countByVerifiedTrue();

    long countByUrlContainingIgnoreCase(String fragment);

    @Query("SELECT COUNT(DISTINCT r.category) FROM ImmigrationResource r")
    long countDistinctCategories();
}
