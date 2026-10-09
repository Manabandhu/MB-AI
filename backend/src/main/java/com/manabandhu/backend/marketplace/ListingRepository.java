package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ListingRepository extends JpaRepository<Listing, UUID> {
    List<Listing> findByStatusOrderByCreatedAtDesc(String status);

    List<Listing> findByCategoryIdAndStatusOrderByCreatedAtDesc(UUID categoryId, String status);

    List<Listing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Page<Listing> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    long countByStatus(String status);

    long countByOwnerId(UUID ownerId);

    /** Listing counts per category for the given status, as {categoryId, count} rows. */
    @Query("SELECT l.category.id, COUNT(l) FROM Listing l WHERE l.status = :status AND l.category IS NOT NULL GROUP BY l.category.id")
    List<Object[]> countByCategoryForStatus(@Param("status") String status);
}
