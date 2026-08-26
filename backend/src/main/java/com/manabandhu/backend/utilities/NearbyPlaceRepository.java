package com.manabandhu.backend.utilities;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface NearbyPlaceRepository extends JpaRepository<NearbyPlace, UUID> {
    List<NearbyPlace> findAllByOrderByCreatedAtDesc();
    List<NearbyPlace> findByCategoryOrderByDistanceKmAsc(String category);
}
