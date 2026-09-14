package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RideOfferRepository extends JpaRepository<RideOffer, UUID> {
    List<RideOffer> findByStatusOrderByDepartureAtAsc(String status);

    List<RideOffer> findByDriverIdOrderByCreatedAtDesc(UUID driverId);

    List<RideOffer> findByDriverIdOrderByDepartureAtDesc(UUID driverId);

    List<RideOffer> findByOriginAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(String origin, String status);

    List<RideOffer> findByDestinationAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(String destination, String status);

    List<RideOffer> findByStatusAndOriginAreaContainingIgnoreCaseAndDestinationAreaContainingIgnoreCaseOrderByDepartureAtAsc(
            String status, String origin, String destination);

    Page<RideOffer> findByStatusOrderByDepartureAtAsc(String status, Pageable pageable);

    @Query("SELECT r FROM RideOffer r WHERE LOWER(r.status) = 'active' AND r.departureAt > :now " +
           "AND (:origin IS NULL OR LOWER(r.originArea) LIKE LOWER(CONCAT('%', :origin, '%'))) " +
           "AND (:destination IS NULL OR LOWER(r.destinationArea) LIKE LOWER(CONCAT('%', :destination, '%'))) " +
           "AND (:avoidTolls IS NULL OR (:avoidTolls = true AND (r.tollPreference = 'AVOID_TOLLS' OR r.tollPreference IS NULL)) OR (:avoidTolls = false)) " +
           "AND (:genderPreference IS NULL OR r.genderPreference = :genderPreference OR r.genderPreference = 'ANY' OR r.genderPreference IS NULL) " +
           "AND (:isRecurring IS NULL OR r.isRecurring = :isRecurring) " +
           "ORDER BY r.departureAt ASC")
    Page<RideOffer> searchActive(
            @Param("now") Instant now,
            @Param("origin") String origin,
            @Param("destination") String destination,
            @Param("avoidTolls") Boolean avoidTolls,
            @Param("genderPreference") String genderPreference,
            @Param("isRecurring") Boolean isRecurring,
            Pageable pageable);

    List<RideOffer> findByChatExpiresAtNotNullAndChatExpiresAtLessThanEqual(Instant now);
}
