package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImmigrationResourceService {

    private final ImmigrationResourceRepository repository;

    ImmigrationResourceService(ImmigrationResourceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ImmigrationResource> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ImmigrationResource> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public List<ImmigrationResource> findByCategory(String category) {
        return repository.findByCategoryOrderByCreatedAtDesc(category);
    }

    @Transactional
    public ImmigrationResource create(UUID ownerId, String title, String description, String category, String url, ImmigrationResource.ResourceType resourceType, String tags, boolean verified) {
        return repository.save(new ImmigrationResource(ownerId, title, description, category, url, resourceType, tags, verified));
    }
}
