package com.manabandhu.backend.utilities;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Utilities home. Directory counts are public; the package count is the signed-in viewer's own. */
@Service
class UtilitiesContentService {

    private final PackageTrackingRepository packageRepository;
    private final NearbyPlaceRepository nearbyRepository;
    private final EmergencyResourceRepository emergencyRepository;

    UtilitiesContentService(PackageTrackingRepository packageRepository, NearbyPlaceRepository nearbyRepository,
                            EmergencyResourceRepository emergencyRepository) {
        this.packageRepository = packageRepository;
        this.nearbyRepository = nearbyRepository;
        this.emergencyRepository = emergencyRepository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent home(Optional<Actor> viewer) {
        var metrics = new ArrayList<CatalogMetric>();
        viewer.ifPresent(actor -> metrics.add(
                new CatalogMetric("Packages", String.valueOf(packageRepository.countByOwnerId(actor.id())))));
        metrics.add(new CatalogMetric("Nearby", String.valueOf(nearbyRepository.count())));
        metrics.add(new CatalogMetric("Emergency resources", String.valueOf(emergencyRepository.count())));
        return new CatalogScreenContent(
                "Utilities",
                "Track packages, find nearby services, and access emergency resources.",
                "Utilities",
                List.copyOf(metrics),
                List.of(
                        new CatalogItem("package", "Package tracking", "Track your shipments and delivery status.", "Packages", null, "active"),
                        new CatalogItem("nearby", "Nearby services", "Find nearby places and emergency resources.", "Services", null, "active")));
    }
}
