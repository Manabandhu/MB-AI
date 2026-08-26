package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImmigrationGuideService {

    private final ImmigrationGuideRepository repository;

    ImmigrationGuideService(ImmigrationGuideRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ImmigrationGuide> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ImmigrationGuide> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public List<ImmigrationGuide> findByCategory(String category) {
        return repository.findByCategoryOrderByCreatedAtDesc(category);
    }

    @Transactional
    public ImmigrationGuide create(UUID ownerId, String title, String description, String content, String category, ImmigrationGuide.DifficultyLevel difficultyLevel, int estimatedDurationMinutes) {
        return repository.save(new ImmigrationGuide(ownerId, title, description, content, category, difficultyLevel, estimatedDurationMinutes));
    }
}
