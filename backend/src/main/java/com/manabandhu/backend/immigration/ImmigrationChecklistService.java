package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImmigrationChecklistService {

    private final ImmigrationChecklistRepository repository;

    ImmigrationChecklistService(ImmigrationChecklistRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ImmigrationChecklist> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ImmigrationChecklist> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public List<ImmigrationChecklist> findByCategory(String category) {
        return repository.findByCategoryOrderByCreatedAtDesc(category);
    }

    @Transactional
    public ImmigrationChecklist create(UUID ownerId, String title, String description, String category, String itemsJson, Instant dueDate) {
        return repository.save(new ImmigrationChecklist(ownerId, title, description, category, itemsJson, dueDate));
    }

    @Transactional
    public ImmigrationChecklist complete(UUID id) {
        var checklist = repository.findById(id).orElseThrow();
        checklist.markCompleted();
        return checklist;
    }
}
