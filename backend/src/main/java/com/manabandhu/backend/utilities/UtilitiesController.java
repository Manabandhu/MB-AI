package com.manabandhu.backend.utilities;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;

@RestController
@RequestMapping("/api/v1/utilities")
public class UtilitiesController {

    private final PackageTrackingService packageService;
    private final NearbyPlaceService nearbyService;
    private final EmergencyResourceService emergencyService;

    UtilitiesController(PackageTrackingService packageService, NearbyPlaceService nearbyService, EmergencyResourceService emergencyService) {
        this.packageService = packageService;
        this.nearbyService = nearbyService;
        this.emergencyService = emergencyService;
    }

    @GetMapping("/home")
    CatalogScreenContent home() {
        return new CatalogScreenContent(
                "Utilities",
                "Track packages, find nearby services, and access emergency resources.",
                "Utilities",
                List.of(
                        new CatalogMetric("Packages", "3"),
                        new CatalogMetric("Nearby", "12")),
                List.of(
                        new CatalogItem("package", "Package tracking", "Track your shipments and delivery status.", "Packages", null, "active"),
                        new CatalogItem("nearby", "Nearby services", "Find nearby places and emergency resources.", "Services", null, "active")));
    }

    @GetMapping("/packages")
    List<PackageTracking> packages(Authentication authentication) {
        return packageService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/packages")
    ResponseEntity<PackageTracking> createPackage(Authentication authentication, @Valid @RequestBody CreatePackageTrackingInput input) {
        var status = PackageTracking.TrackingStatus.valueOf(input.status());
        var tracking = packageService.create(UUID.fromString(authentication.getName()), input.trackingNumber(), input.carrier(), status, input.estimatedDelivery());
        return ResponseEntity.created(URI.create("/api/v1/utilities/packages/" + tracking.getId())).body(tracking);
    }

    @GetMapping("/nearby")
    List<NearbyPlace> nearby(@RequestParam(required = false) String category) {
        return category != null ? nearbyService.findByCategory(category) : nearbyService.findAll();
    }

    @GetMapping("/emergency")
    List<EmergencyResource> emergency(@RequestParam(required = false) String category) {
        return category != null ? emergencyService.findByCategory(category) : emergencyService.findAll();
    }
}
