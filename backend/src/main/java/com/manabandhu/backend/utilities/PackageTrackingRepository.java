package com.manabandhu.backend.utilities;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface PackageTrackingRepository extends JpaRepository<PackageTracking, UUID> {
    List<PackageTracking> findByOwnerIdOrderByLastUpdateDesc(UUID ownerId);
}
