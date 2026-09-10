package com.manabandhu.backend.jobs;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class JobsGraphqlController {

    private final JobCategoryService categoryService;
    private final JobPostingService postingService;
    private final JobApplicationService applicationService;

    JobsGraphqlController(JobCategoryService categoryService, JobPostingService postingService,
                          JobApplicationService applicationService) {
        this.categoryService = categoryService;
        this.postingService = postingService;
        this.applicationService = applicationService;
    }

    @QueryMapping
    List<JobCategory> jobCategories() {
        return categoryService.findAll();
    }

    @QueryMapping
    List<JobPosting> jobPostings() {
        return postingService.findAll(Pageable.unpaged()).getContent();
    }

    @QueryMapping
    JobPosting jobPosting(@Argument UUID id) {
        return postingService.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job posting not found"));
    }

    @QueryMapping
    List<JobApplication> jobApplications(@Argument UUID jobId) {
        return applicationService.findByJobId(jobId);
    }

    @MutationMapping
    JobCategory createJobCategory(@Argument @Valid CreateJobCategoryInput input) {
        return categoryService.create(input.name(), input.slug());
    }

    @MutationMapping
    JobPosting createJobPosting(Authentication authentication, @Argument @Valid CreateJobPostingInput input) {
        return postingService.create(UUID.fromString(authentication.getName()), input.categoryId(), input.title(),
                input.company(), input.location(), input.description(), input.employmentType(), input.isRemote(),
                input.salaryMin(), input.salaryMax(), input.applicationUrl());
    }

    @MutationMapping
    JobPosting updateJobPosting(@Argument UUID id, @Argument @Valid UpdateJobPostingInput input) {
        return postingService.update(id, input.categoryId(), input.title(), input.company(), input.location(),
                input.description(), input.employmentType(), input.isRemote(), input.salaryMin(), input.salaryMax(),
                input.applicationUrl(), input.status());
    }

    @MutationMapping
    JobApplication createJobApplication(Authentication authentication, @Argument UUID jobId,
                                        @Argument @Valid CreateJobApplicationInput input) {
        return applicationService.create(jobId, UUID.fromString(authentication.getName()),
                input.coverLetter(), input.resumeUrl());
    }

    @MutationMapping
    JobApplication updateJobApplicationStatus(@Argument UUID id, @Argument @Valid UpdateJobApplicationInput input) {
        return applicationService.updateStatus(id, input.status());
    }
}
