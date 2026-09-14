package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RoomListingRepository extends JpaRepository<RoomListing, UUID> {
    List<RoomListing> findByStatusOrderByCreatedAtDesc(String status);

    List<RoomListing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<RoomListing> findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String location, String status);

    List<RoomListing> findByRoomTypeAndStatusOrderByCreatedAtDesc(String roomType, String status);

    Page<RoomListing> findByStatusAndRoomTypeAndBroadLocationContainingIgnoreCaseOrderByCreatedAtDesc(
            String status, String roomType, String location, Pageable pageable);

    Page<RoomListing> findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String location, String status, Pageable pageable);

    Page<RoomListing> findByRoomTypeAndStatusOrderByCreatedAtDesc(String roomType, String status, Pageable pageable);

    Page<RoomListing> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("""
        SELECT l FROM RoomListing l
        WHERE (:status IS NULL OR l.status = :status)
          AND (:city IS NULL OR LOWER(l.broadLocation) LIKE LOWER(CONCAT('%', :city, '%')) OR LOWER(l.title) LIKE LOWER(CONCAT('%', :city, '%')))
          AND (:stateCode IS NULL OR l.stateCode = :stateCode)
          AND (:dietaryPreference IS NULL OR :dietaryPreference = 'ANY' OR l.dietaryPreference = :dietaryPreference OR l.dietaryPreference = 'ANY')
          AND (:genderPreference IS NULL OR :genderPreference = 'ANY' OR l.genderPreference = :genderPreference OR l.genderPreference = 'ANY')
          AND (:minRent IS NULL OR l.price >= :minRent)
          AND (:maxRent IS NULL OR l.price <= :maxRent)
          AND (:bathroomType IS NULL OR l.bathroomType = :bathroomType)
        ORDER BY l.createdAt DESC
    """)
    Page<RoomListing> searchListings(
            @Param("status") String status,
            @Param("city") String city,
            @Param("stateCode") String stateCode,
            @Param("dietaryPreference") String dietaryPreference,
            @Param("genderPreference") String genderPreference,
            @Param("minRent") BigDecimal minRent,
            @Param("maxRent") BigDecimal maxRent,
            @Param("bathroomType") String bathroomType,
            Pageable pageable);

    @Query(value = "SELECT l.* FROM room_listings l INNER JOIN room_favorites f ON l.id = f.listing_id WHERE f.user_id = :userId AND l.status IN ('active', 'paused') ORDER BY f.created_at DESC", nativeQuery = true)
    List<RoomListing> findSavedListingsByUserId(@Param("userId") UUID userId);
}
