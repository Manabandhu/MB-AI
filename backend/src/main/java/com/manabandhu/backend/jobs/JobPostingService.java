package com.manabandhu.backend.jobs;

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

    /** Statuses an owner may set; stored lowercase. */
    static final java.util.Set<String> STATUSES = java.util.Set.of("open", "closed");

    /**
     * Owner (or admin) edit. A field that is null keeps its value; a blank optional text field clears it; blank
     * title or description is rejected. {@code clearSalary} empties both salary bounds before any new ones apply.
     */
    @Transactional
    public JobPosting update(com.manabandhu.backend.auth.Actor actor, UUID id, UpdateJobPostingInput input) {
        var posting = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found"));
        actor.requireOwner(posting.getOwnerId(), "Not authorized to update this job posting");
        if (input.categoryId() != null) {
            posting.category = categoryRepository.findById(input.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        }
        if (input.title() != null) posting.title = required(input.title(), "title");
        if (input.description() != null) posting.description = required(input.description(), "description");
        if (input.company() != null) posting.company = blankToNull(input.company());
        if (input.location() != null) posting.location = blankToNull(input.location());
        if (input.employmentType() != null) posting.employmentType = blankToNull(input.employmentType());
        if (input.applicationUrl() != null) posting.applicationUrl = blankToNull(input.applicationUrl());
        if (input.isRemote() != null) posting.isRemote = input.isRemote();
        if (Boolean.TRUE.equals(input.clearSalary())) {
            posting.salaryMin = null;
            posting.salaryMax = null;
        }
        if (input.salaryMin() != null) posting.salaryMin = input.salaryMin();
        if (input.salaryMax() != null) posting.salaryMax = input.salaryMax();
        if (posting.salaryMin != null && posting.salaryMax != null && posting.salaryMax < posting.salaryMin) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "salaryMax must be at least salaryMin");
        }
        if (input.status() != null) {
            var status = input.status().trim().toLowerCase(java.util.Locale.ROOT);
            if (!STATUSES.contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be open or closed");
            }
            posting.status = status;
        }
        posting.updatedAt = java.time.Instant.now();
        return repository.save(posting);
    }

    private static String blankToNull(String value) {
        return value.isBlank() ? null : value.trim();
    }

    private static String required(String value, String field) {
        if (value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " cannot be empty");
        }
        return value.trim();
    }

    /** Owner (or admin) delete; applications cascade. */
    @Transactional
    public void delete(com.manabandhu.backend.auth.Actor actor, UUID id) {
        var posting = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found"));
        actor.requireOwner(posting.getOwnerId(), "Not authorized to delete this job posting");
        repository.delete(posting);
    }
}
