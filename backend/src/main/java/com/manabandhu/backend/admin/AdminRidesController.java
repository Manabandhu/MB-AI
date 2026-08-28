package com.manabandhu.backend.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.rides.RideOffer;
import com.manabandhu.backend.rides.RideOfferService;

@RestController
@RequestMapping("/api/v1/admin/rides")
public class AdminRidesController {

    private final RideOfferService rideOfferService;
    private final AdminAccessPolicy accessPolicy;

    AdminRidesController(RideOfferService rideOfferService, AdminAccessPolicy accessPolicy) {
        this.rideOfferService = rideOfferService;
        this.accessPolicy = accessPolicy;
    }

    record AdminRideProjection(
            UUID id,
            String from,
            String to,
            String driverId,
            String status,
            boolean reported,
            String createdAt) {
    }

    @GetMapping
    List<AdminRideProjection> rides(Authentication authentication) {
        accessPolicy.require(authentication);
        return rideOfferService.findAllForAdmin().stream()
                .map(offer -> new AdminRideProjection(
                        offer.getId(),
                        offer.getOriginArea(),
                        offer.getDestinationArea(),
                        offer.getDriverId().toString(),
                        offer.getStatus(),
                        false,
                        offer.getCreatedAt().toString()))
                .toList();
    }
}
