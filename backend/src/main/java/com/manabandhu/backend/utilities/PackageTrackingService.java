package com.manabandhu.backend.utilities;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PackageTrackingService {

    private final PackageTrackingRepository repository;

    PackageTrackingService(PackageTrackingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PackageTracking> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByLastUpdateDesc(ownerId);
    }

    @Transactional
    public PackageTracking create(UUID ownerId, String trackingNumber, String carrier, PackageTracking.TrackingStatus status, java.time.Instant estimatedDelivery) {
        return repository.save(new PackageTracking(ownerId, trackingNumber, carrier, status, estimatedDelivery));
    }

    @Transactional
    public PackageTracking updateStatus(UUID id, PackageTracking.TrackingStatus status) {
        var tracking = repository.findById(id).orElseThrow();
        tracking.updateStatus(status);
        return tracking;
    }
}
