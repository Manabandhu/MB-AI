package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RideOfferRepository extends JpaRepository<RideOffer, UUID> {
    /** Locks the offer row so concurrent bookings cannot oversell seats. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RideOffer r WHERE r.id = :id")
    Optional<RideOffer> findByIdForUpdate(@Param("id") UUID id);

    List<RideOffer> findByStatusOrderByDepartureAtAsc(String status);

    List<RideOffer> findByDriverIdOrderByCreatedAtDesc(UUID driverId);

    List<RideOffer> findByDriverIdOrderByDepartureAtDesc(UUID driverId);

    Page<RideOffer> findByStatusOrderByDepartureAtAsc(String status, Pageable pageable);

    @Query("SELECT r FROM RideOffer r WHERE LOWER(r.status) = 'active' AND r.departureAt > :now " +
           "AND (cast(:origin as String) IS NULL OR LOWER(r.originArea) LIKE LOWER(CONCAT('%', cast(:origin as String), '%'))) " +
           "AND (cast(:destination as String) IS NULL OR LOWER(r.destinationArea) LIKE LOWER(CONCAT('%', cast(:destination as String), '%'))) " +
           "AND (:avoidTolls IS NULL OR (:avoidTolls = true AND (r.tollPreference = 'AVOID_TOLLS' OR r.tollPreference IS NULL)) OR (:avoidTolls = false)) " +
           "AND (cast(:genderPreference as String) IS NULL OR r.genderPreference = :genderPreference OR r.genderPreference = 'ANY' OR r.genderPreference IS NULL) " +
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

    /** Upcoming active offers, matching {@link #searchActive} with no filters. */
    @Query("SELECT COUNT(r) FROM RideOffer r WHERE LOWER(r.status) = 'active' AND r.departureAt > :now")
    long countOpen(@Param("now") Instant now);

    @Query("SELECT COALESCE(SUM(r.seatsAvailable), 0) FROM RideOffer r WHERE LOWER(r.status) = 'active' AND r.departureAt > :now")
    Long sumOpenSeats(@Param("now") Instant now);

    @Query("SELECT COUNT(DISTINCT LOWER(r.originArea)) FROM RideOffer r WHERE LOWER(r.status) = 'active' AND r.departureAt > :now")
    long countOpenPickupAreas(@Param("now") Instant now);

    @Query("SELECT COUNT(DISTINCT LOWER(r.destinationArea)) FROM RideOffer r WHERE LOWER(r.status) = 'active' AND r.departureAt > :now")
    long countOpenDestinations(@Param("now") Instant now);
}
