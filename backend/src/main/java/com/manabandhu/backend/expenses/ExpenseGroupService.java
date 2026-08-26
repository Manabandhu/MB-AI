package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseGroupService {

    private final ExpenseGroupRepository repository;

    ExpenseGroupService(ExpenseGroupRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExpenseGroup> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ExpenseGroup> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public ExpenseGroup create(UUID ownerId, String name, String description) {
        return repository.save(new ExpenseGroup(ownerId, name, description));
    }

    @Transactional
    public ExpenseGroup update(UUID id, String name, String description) {
        var group = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Expense group not found"));
        if (name != null) group.name = name;
        if (description != null) group.description = description;
        group.updatedAt = java.time.Instant.now();
        return repository.save(group);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Expense group not found");
        }
        repository.deleteById(id);
    }
}
