package com.manabandhu.backend.utilities;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class UtilitiesGraphqlController {

    private final PackageTrackingService packageService;
    private final NearbyPlaceService nearbyService;
    private final EmergencyResourceService emergencyService;

    UtilitiesGraphqlController(PackageTrackingService packageService, NearbyPlaceService nearbyService, EmergencyResourceService emergencyService) {
        this.packageService = packageService;
        this.nearbyService = nearbyService;
        this.emergencyService = emergencyService;
    }

    @QueryMapping
    List<PackageTracking> packageTrackings(Authentication authentication) {
        return packageService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    PackageTracking createPackageTracking(Authentication authentication, @Argument @Valid CreatePackageTrackingInput input) {
        var status = PackageTracking.TrackingStatus.valueOf(input.status());
        return packageService.create(UUID.fromString(authentication.getName()), input.trackingNumber(), input.carrier(), status, input.estimatedDelivery());
    }

    @QueryMapping
    List<NearbyPlace> nearbyPlaces(@Argument String category) {
        return category != null ? nearbyService.findByCategory(category) : nearbyService.findAll();
    }

    @QueryMapping
    List<EmergencyResource> emergencyResources(@Argument String category) {
        return category != null ? emergencyService.findByCategory(category) : emergencyService.findAll();
    }
}
