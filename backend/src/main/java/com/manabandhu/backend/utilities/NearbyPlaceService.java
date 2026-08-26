package com.manabandhu.backend.utilities;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NearbyPlaceService {

    private final NearbyPlaceRepository repository;

    NearbyPlaceService(NearbyPlaceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NearbyPlace> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<NearbyPlace> findByCategory(String category) {
        return repository.findByCategoryOrderByDistanceKmAsc(category);
    }

    @Transactional
    public NearbyPlace create(String name, String category, String address, double latitude, double longitude, Double rating, Double distanceKm, String phone) {
        return repository.save(new NearbyPlace(name, category, address, latitude, longitude, rating, distanceKm, phone));
    }
}
