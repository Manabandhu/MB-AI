package com.manabandhu.backend.rides;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface RideOfferRepository extends JpaRepository<RideOffer, UUID> {
    List<RideOffer> findByStatusOrderByDepartureAtAsc(String status);

    List<RideOffer> findByDriverIdOrderByCreatedAtDesc(UUID driverId);

    List<RideOffer> findByOriginAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(String origin, String status);

    List<RideOffer> findByDestinationAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(String destination, String status);

    List<RideOffer> findByStatusAndOriginAreaContainingIgnoreCaseAndDestinationAreaContainingIgnoreCaseOrderByDepartureAtAsc(
            String status, String origin, String destination);

    Page<RideOffer> findByStatusOrderByDepartureAtAsc(String status, Pageable pageable);

    Page<RideOffer> findByOriginAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(String origin, String status, Pageable pageable);

    Page<RideOffer> findByDestinationAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(String destination, String status, Pageable pageable);

    Page<RideOffer> findByStatusAndOriginAreaContainingIgnoreCaseAndDestinationAreaContainingIgnoreCaseOrderByDepartureAtAsc(
            String status, String origin, String destination, Pageable pageable);
}
