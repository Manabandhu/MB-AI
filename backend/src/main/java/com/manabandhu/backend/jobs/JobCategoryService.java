package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JobCategoryService {

    private final JobCategoryRepository repository;

    JobCategoryService(JobCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<JobCategory> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Optional<JobCategory> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public JobCategory create(String name, String slug) {
        if (repository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slug already exists");
        }
        return repository.save(new JobCategory(name, slug));
    }
}
