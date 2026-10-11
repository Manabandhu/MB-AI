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

    List<Listing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    /** Public search: every filter optional; reserved and sold items stay visible (with a badge) unless only active is asked for. */
    @Query("""
        SELECT l FROM Listing l
        WHERE l.status IN :statuses
          AND (cast(:q as String) IS NULL
               OR LOWER(l.title) LIKE LOWER(CONCAT('%', cast(:q as String), '%'))
               OR LOWER(l.description) LIKE LOWER(CONCAT('%', cast(:q as String), '%')))
          AND (:categoryId IS NULL OR l.category.id = :categoryId)
          AND (cast(:condition as String) IS NULL OR l.condition = cast(:condition as String))
          AND (:maxPrice IS NULL OR l.price <= :maxPrice)
        ORDER BY l.createdAt DESC
    """)
    Page<Listing> search(@Param("statuses") java.util.Collection<String> statuses, @Param("q") String q,
                         @Param("categoryId") UUID categoryId, @Param("condition") String condition,
                         @Param("maxPrice") java.math.BigDecimal maxPrice, Pageable pageable);

    @Query("""
        SELECT l FROM Listing l, ListingFavorite f
        WHERE f.listingId = l.id AND f.userId = :userId AND l.status IN ('active', 'reserved', 'sold')
        ORDER BY f.createdAt DESC
    """)
    List<Listing> findSavedBy(@Param("userId") UUID userId, Pageable pageable);

    Page<Listing> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    long countByStatus(String status);

    long countByOwnerId(UUID ownerId);

    /** Listing counts per category for the given status, as {categoryId, count} rows. */
    @Query("SELECT l.category.id, COUNT(l) FROM Listing l WHERE l.status = :status AND l.category IS NOT NULL GROUP BY l.category.id")
    List<Object[]> countByCategoryForStatus(@Param("status") String status);
}
