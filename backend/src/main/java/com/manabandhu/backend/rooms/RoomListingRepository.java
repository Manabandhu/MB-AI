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

    List<RoomListing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    List<RoomListing> findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String location, String status);

    List<RoomListing> findByRoomTypeAndStatusOrderByCreatedAtDesc(String roomType, String status);

    Page<RoomListing> findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String location, String status, Pageable pageable);

    Page<RoomListing> findByRoomTypeAndStatusOrderByCreatedAtDesc(String roomType, String status, Pageable pageable);

    Page<RoomListing> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Single search used by the listings endpoint. Every filter is optional; the optional bounding box
     * implements "within N miles" without needing PostGIS. It compares the rounded coordinates the public sees, so
     * shrinking the box cannot reveal the exact location.
     */
    @Query("""
        SELECT l FROM RoomListing l
        WHERE l.status = :status
          AND (cast(:location as String) IS NULL
               OR LOWER(l.broadLocation) LIKE LOWER(CONCAT('%', cast(:location as String), '%'))
               OR LOWER(l.title) LIKE LOWER(CONCAT('%', cast(:location as String), '%')))
          AND (cast(:roomType as String) IS NULL OR l.roomType = cast(:roomType as String))
          AND (cast(:stateCode as String) IS NULL OR l.stateCode = cast(:stateCode as String))
          AND (cast(:dietaryPreference as String) IS NULL OR cast(:dietaryPreference as String) = 'ANY'
               OR l.dietaryPreference = cast(:dietaryPreference as String) OR l.dietaryPreference = 'ANY')
          AND (cast(:genderPreference as String) IS NULL OR cast(:genderPreference as String) = 'ANY'
               OR l.genderPreference = cast(:genderPreference as String) OR l.genderPreference = 'ANY')
          AND (:minRent IS NULL OR l.price >= :minRent)
          AND (:maxRent IS NULL OR l.price <= :maxRent)
          AND (cast(:bathroomType as String) IS NULL OR l.bathroomType LIKE CONCAT(cast(:bathroomType as String), '%'))
          AND (:minLat IS NULL OR (round(l.latitude, 2) BETWEEN :minLat AND :maxLat
                                   AND round(l.longitude, 2) BETWEEN :minLng AND :maxLng))
        ORDER BY l.createdAt DESC
    """)
    Page<RoomListing> searchListings(
            @Param("status") String status,
            @Param("location") String location,
            @Param("roomType") String roomType,
            @Param("stateCode") String stateCode,
            @Param("dietaryPreference") String dietaryPreference,
            @Param("genderPreference") String genderPreference,
            @Param("minRent") BigDecimal minRent,
            @Param("maxRent") BigDecimal maxRent,
            @Param("bathroomType") String bathroomType,
            @Param("minLat") BigDecimal minLat,
            @Param("maxLat") BigDecimal maxLat,
            @Param("minLng") BigDecimal minLng,
            @Param("maxLng") BigDecimal maxLng,
            Pageable pageable);

    @Query(value = "SELECT l.* FROM room_listings l INNER JOIN room_favorites f ON l.id = f.listing_id WHERE f.user_id = :userId AND l.status IN ('active', 'paused') ORDER BY f.created_at DESC LIMIT 200", nativeQuery = true)
    List<RoomListing> findSavedListingsByUserId(@Param("userId") UUID userId);

    long countByStatus(String status);

    long countByOwnerId(UUID ownerId);

    /** Saved listings the user can still see; matches {@link #findSavedListingsByUserId}. */
    @Query(value = "SELECT count(*) FROM room_listings l INNER JOIN room_favorites f ON l.id = f.listing_id WHERE f.user_id = :userId AND l.status IN ('active', 'paused')", nativeQuery = true)
    long countSavedListingsByUserId(@Param("userId") UUID userId);
}
