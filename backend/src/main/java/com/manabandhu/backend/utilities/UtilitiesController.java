package com.manabandhu.backend.utilities;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.catalog.CatalogScreenContent;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/utilities")
public class UtilitiesController {

    private final PackageTrackingService packageService;
    private final NearbyPlaceService nearbyService;
    private final EmergencyResourceService emergencyService;
    private final UtilitiesContentService contentService;

    UtilitiesController(PackageTrackingService packageService, NearbyPlaceService nearbyService, EmergencyResourceService emergencyService,
                        UtilitiesContentService contentService) {
        this.packageService = packageService;
        this.nearbyService = nearbyService;
        this.emergencyService = emergencyService;
        this.contentService = contentService;
    }

    @GetMapping("/home")
    CatalogScreenContent home(Authentication authentication) {
        return contentService.home(Actor.from(authentication));
    }

    @GetMapping("/packages")
    List<PackageTracking> packages(Authentication authentication) {
        return packageService.findByOwner(Actor.require(authentication).id());
    }

    @PostMapping("/packages")
    ResponseEntity<PackageTracking> createPackage(Authentication authentication, @Valid @RequestBody CreatePackageTrackingInput input) {
        var status = PackageTracking.TrackingStatus.parse(input.status());
        var tracking = packageService.create(Actor.require(authentication).id(), input.trackingNumber(), input.carrier(), status, input.estimatedDelivery());
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
