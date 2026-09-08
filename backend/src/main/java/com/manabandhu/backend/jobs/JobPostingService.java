package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JobPostingService {

    private final JobPostingRepository repository;
    private final JobCategoryRepository categoryRepository;

    JobPostingService(JobPostingRepository repository, JobCategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<JobPosting> findAll(Pageable pageable) {
        return repository.findByStatusOrderByCreatedAtDesc("open", pageable);
    }

    @Transactional(readOnly = true)
    public Optional<JobPosting> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public JobPosting create(UUID ownerId, UUID categoryId, String title, String company, String location,
                             String description, String employmentType, Boolean isRemote, Integer salaryMin,
                             Integer salaryMax, String applicationUrl) {
        var category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        var posting = new JobPosting(ownerId, category, title, company, location, description, employmentType,
                isRemote, salaryMin, salaryMax, applicationUrl, "open");
        return repository.save(posting);
    }

    @Transactional
    public JobPosting update(UUID id, UUID categoryId, String title, String company, String location,
                             String description, String employmentType, Boolean isRemote, Integer salaryMin,
                             Integer salaryMax, String applicationUrl, String status) {
        var posting = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found"));
        if (categoryId != null) {
            var category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
            posting.category = category;
        }
        if (title != null) posting.title = title;
        if (company != null) posting.company = company;
        if (location != null) posting.location = location;
        if (description != null) posting.description = description;
        if (employmentType != null) posting.employmentType = employmentType;
        if (isRemote != null) posting.isRemote = isRemote;
        if (salaryMin != null) posting.salaryMin = salaryMin;
        if (salaryMax != null) posting.salaryMax = salaryMax;
        if (applicationUrl != null) posting.applicationUrl = applicationUrl;
        if (status != null) posting.status = status;
        posting.updatedAt = java.time.Instant.now();
        return repository.save(posting);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found");
        }
        repository.deleteById(id);
    }
}
