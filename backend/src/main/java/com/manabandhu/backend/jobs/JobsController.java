package com.manabandhu.backend.jobs;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.manabandhu.backend.foundation.CatalogScreenContent;
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

    private static UUID actorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return UUID.fromString(authentication.getName());
    }

    private static boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) return false;
        return authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_SUPER_ADMIN") || a.equals("ROLE_ADMIN"));
    }

    @PostMapping("/categories")
    ResponseEntity<JobCategory> createCategory(Authentication authentication, @Valid @RequestBody CreateJobCategoryInput input) {
        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Admin access required");
        }
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
    Page<JobPosting> postings(Pageable pageable) {
        return postingService.findAll(pageable);
    }

    @PostMapping
    ResponseEntity<JobPosting> create(Authentication authentication, @Valid @RequestBody CreateJobPostingInput input) {
        var posting = postingService.create(actorId(authentication), input.categoryId(),
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
    JobPosting update(Authentication authentication, @PathVariable UUID jobId, @Valid @RequestBody UpdateJobPostingInput input) {
        var actorId = actorId(authentication);
        var posting = postingService.findById(jobId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
        if (!posting.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to update this job posting");
        }
        return postingService.update(jobId, input.categoryId(), input.title(), input.company(), input.location(),
                input.description(), input.employmentType(), input.isRemote(), input.salaryMin(), input.salaryMax(),
                input.applicationUrl(), input.status());
    }

    @DeleteMapping("/{jobId}")
    ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID jobId) {
        var actorId = actorId(authentication);
        var posting = postingService.findById(jobId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
        if (!posting.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to delete this job posting");
        }
        postingService.delete(jobId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{jobId}/applications")
    List<JobApplication> applications(Authentication authentication, @PathVariable UUID jobId) {
        var actorId = actorId(authentication);
        var posting = postingService.findById(jobId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
        if (!posting.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to view applicants for this job");
        }
        return applicationService.findByJobId(jobId);
    }

    @PostMapping("/{jobId}/applications")
    ResponseEntity<JobApplication> apply(Authentication authentication, @PathVariable UUID jobId,
                                         @Valid @RequestBody CreateJobApplicationInput input) {
        var application = applicationService.create(jobId, actorId(authentication),
                input.coverLetter(), input.resumeUrl());
        return ResponseEntity.created(URI.create("/api/v1/jobs/applications/" + application.getId())).body(application);
    }

    @PatchMapping("/applications/{applicationId}")
    JobApplication updateApplication(Authentication authentication, @PathVariable UUID applicationId,
                                    @Valid @RequestBody UpdateJobApplicationInput input) {
        var actorId = actorId(authentication);
        var application = applicationService.findById(applicationId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job application not found"));
        var posting = postingService.findById(application.getJobPostingId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
        if (!posting.getOwnerId().equals(actorId) && !application.getApplicantId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to update this application");
        }
        return applicationService.updateStatus(applicationId, input.status());
    }
}
