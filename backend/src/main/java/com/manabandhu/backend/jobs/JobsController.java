package com.manabandhu.backend.jobs;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/jobs")
public class JobsController {

    private final JobCategoryService categoryService;
    private final JobPostingService postingService;
    private final JobApplicationService applicationService;
    private final JobsContentService contentService;

    JobsController(JobCategoryService categoryService, JobPostingService postingService,
                   JobApplicationService applicationService, JobsContentService contentService) {
        this.categoryService = categoryService;
        this.postingService = postingService;
        this.applicationService = applicationService;
        this.contentService = contentService;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/categories")
    List<JobCategory> categories() {
        return categoryService.findAll();
    }

    @PostMapping("/categories")
    ResponseEntity<JobCategory> createCategory(@Valid @RequestBody CreateJobCategoryInput input) {
        var category = categoryService.create(input.name(), input.slug());
        return ResponseEntity.created(URI.create("/api/v1/jobs/categories/" + category.getId())).body(category);
    }

    @GetMapping("/categories/{categoryId}")
    JobCategory category(@PathVariable UUID categoryId) {
        return categoryService.findById(categoryId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Category not found"));
    }

    @GetMapping
    List<JobPosting> postings() {
        return postingService.findAll();
    }

    @PostMapping
    ResponseEntity<JobPosting> create(Authentication authentication, @Valid @RequestBody CreateJobPostingInput input) {
        var posting = postingService.create(UUID.fromString(authentication.getName()), input.categoryId(),
                input.title(), input.company(), input.location(), input.description(), input.employmentType(),
                input.isRemote(), input.salaryMin(), input.salaryMax(), input.applicationUrl());
        return ResponseEntity.created(URI.create("/api/v1/jobs/" + posting.getId())).body(posting);
    }

    @GetMapping("/{jobId}")
    JobPosting posting(@PathVariable UUID jobId) {
        return postingService.findById(jobId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
    }

    @PatchMapping("/{jobId}")
    JobPosting update(@PathVariable UUID jobId, @Valid @RequestBody UpdateJobPostingInput input) {
        return postingService.update(jobId, input.categoryId(), input.title(), input.company(), input.location(),
                input.description(), input.employmentType(), input.isRemote(), input.salaryMin(), input.salaryMax(),
                input.applicationUrl(), input.status());
    }

    @DeleteMapping("/{jobId}")
    ResponseEntity<Void> delete(@PathVariable UUID jobId) {
        postingService.delete(jobId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{jobId}/applications")
    List<JobApplication> applications(@PathVariable UUID jobId) {
        return applicationService.findByJobId(jobId);
    }

    @PostMapping("/{jobId}/applications")
    ResponseEntity<JobApplication> apply(Authentication authentication, @PathVariable UUID jobId,
                                         @Valid @RequestBody CreateJobApplicationInput input) {
        var application = applicationService.create(jobId, UUID.fromString(authentication.getName()),
                input.coverLetter(), input.resumeUrl());
        return ResponseEntity.created(URI.create("/api/v1/jobs/applications/" + application.getId())).body(application);
    }

    @PatchMapping("/applications/{applicationId}")
    JobApplication updateApplication(@PathVariable UUID applicationId,
                                    @Valid @RequestBody UpdateJobApplicationInput input) {
        return applicationService.updateStatus(applicationId, input.status());
    }
}
