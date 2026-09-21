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

    @Query(value = """
        SELECT * FROM public.room_listings l
        WHERE (:status IS NULL OR l.status = :status)
          AND (:city IS NULL OR LOWER(l.broad_location) LIKE LOWER(CONCAT('%', :city, '%')) OR LOWER(l.title) LIKE LOWER(CONCAT('%', :city, '%')))
          AND (:stateCode IS NULL OR l.state_code = :stateCode)
          AND (:dietaryPreference IS NULL OR :dietaryPreference = 'ANY' OR l.dietary_preference = :dietaryPreference OR l.dietary_preference = 'ANY')
          AND (:genderPreference IS NULL OR :genderPreference = 'ANY' OR l.gender_preference = :genderPreference OR l.gender_preference = 'ANY')
          AND (:minRent IS NULL OR l.price >= :minRent)
          AND (:maxRent IS NULL OR l.price <= :maxRent)
          AND (:bathroomType IS NULL OR l.bathroom_type = :bathroomType)
          AND (
            (:lat IS NULL OR :lng IS NULL OR :radiusMeters IS NULL)
            OR (
                l.location IS NOT NULL
                AND ST_DWithin(l.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            )
            OR (
                l.location IS NULL AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
                AND ST_DWithin(
                    ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radiusMeters
                )
            )
          )
          AND (
            (:minLat IS NULL OR :maxLat IS NULL OR :minLng IS NULL OR :maxLng IS NULL)
            OR (
                l.latitude BETWEEN :minLat AND :maxLat
                AND l.longitude BETWEEN :minLng AND :maxLng
            )
          )
        ORDER BY l.created_at DESC
    """, countQuery = """
        SELECT count(*) FROM public.room_listings l
        WHERE (:status IS NULL OR l.status = :status)
          AND (:city IS NULL OR LOWER(l.broad_location) LIKE LOWER(CONCAT('%', :city, '%')) OR LOWER(l.title) LIKE LOWER(CONCAT('%', :city, '%')))
          AND (:stateCode IS NULL OR l.state_code = :stateCode)
          AND (:dietaryPreference IS NULL OR :dietaryPreference = 'ANY' OR l.dietary_preference = :dietaryPreference OR l.dietary_preference = 'ANY')
          AND (:genderPreference IS NULL OR :genderPreference = 'ANY' OR l.gender_preference = :genderPreference OR l.gender_preference = 'ANY')
          AND (:minRent IS NULL OR l.price >= :minRent)
          AND (:maxRent IS NULL OR l.price <= :maxRent)
          AND (:bathroomType IS NULL OR l.bathroom_type = :bathroomType)
          AND (
            (:lat IS NULL OR :lng IS NULL OR :radiusMeters IS NULL)
            OR (
                l.location IS NOT NULL
                AND ST_DWithin(l.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            )
            OR (
                l.location IS NULL AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
                AND ST_DWithin(
                    ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radiusMeters
                )
            )
          )
          AND (
            (:minLat IS NULL OR :maxLat IS NULL OR :minLng IS NULL OR :maxLng IS NULL)
            OR (
                l.latitude BETWEEN :minLat AND :maxLat
                AND l.longitude BETWEEN :minLng AND :maxLng
            )
          )
    """, nativeQuery = true)
    Page<RoomListing> searchListingsWithGeo(
            @Param("status") String status,
            @Param("city") String city,
            @Param("stateCode") String stateCode,
            @Param("dietaryPreference") String dietaryPreference,
            @Param("genderPreference") String genderPreference,
            @Param("minRent") BigDecimal minRent,
            @Param("maxRent") BigDecimal maxRent,
            @Param("bathroomType") String bathroomType,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusMeters") Double radiusMeters,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng,
            Pageable pageable);

    @Query(value = "SELECT l.* FROM room_listings l INNER JOIN room_favorites f ON l.id = f.listing_id WHERE f.user_id = :userId AND l.status IN ('active', 'paused') ORDER BY f.created_at DESC", nativeQuery = true)
    List<RoomListing> findSavedListingsByUserId(@Param("userId") UUID userId);
}
