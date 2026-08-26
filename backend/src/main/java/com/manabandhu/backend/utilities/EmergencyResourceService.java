package com.manabandhu.backend.utilities;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmergencyResourceService {

    private final EmergencyResourceRepository repository;

    EmergencyResourceService(EmergencyResourceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<EmergencyResource> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<EmergencyResource> findByCategory(String category) {
        return repository.findByCategoryOrderByNameAsc(category);
    }

    @Transactional
    public EmergencyResource create(String name, String category, String address, String phone, String hours, String description, double latitude, double longitude) {
        return repository.save(new EmergencyResource(name, category, address, phone, hours, description, latitude, longitude));
    }
}
