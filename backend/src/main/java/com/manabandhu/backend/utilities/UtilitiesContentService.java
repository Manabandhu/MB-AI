package com.manabandhu.backend.utilities;

import static com.manabandhu.backend.common.catalog.CatalogContent.metrics;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.catalog.CatalogItem;
import com.manabandhu.backend.common.catalog.CatalogScreenContent;

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
        return new CatalogScreenContent(
                "Utilities",
                "Track packages, find nearby services, and access emergency resources.",
                "Utilities",
                metrics()
                        .addFor(viewer, "Packages", actor -> packageRepository.countByOwnerId(actor.id()))
                        .add("Nearby", nearbyRepository.count())
                        .add("Emergency resources", emergencyRepository.count())
                        .build(),
                List.of(
                        new CatalogItem("package", "Package tracking", "Track your shipments and delivery status.", "Packages", null, "active"),
                        new CatalogItem("nearby", "Nearby services", "Find nearby places and emergency resources.", "Services", null, "active")));
    }
}
