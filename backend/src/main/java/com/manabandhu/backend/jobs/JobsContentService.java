package com.manabandhu.backend.jobs;

import static com.manabandhu.backend.common.catalog.CatalogContent.item;
import static com.manabandhu.backend.common.catalog.CatalogContent.metric;
import static com.manabandhu.backend.common.catalog.CatalogContent.metrics;
import static com.manabandhu.backend.common.catalog.CatalogContent.personal;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.catalog.CatalogScreenContent;
import com.manabandhu.backend.common.catalog.UnknownCatalogScreenException;

/**
 * Jobs screens. Open job counts come from COUNT queries; application and posting counts are the signed-in
 * viewer's own. Screens without a data source show no metrics.
 */
@Service
class JobsContentService {

    private static final String OPEN = "open";

    private final JobPostingRepository postingRepository;
    private final JobApplicationRepository applicationRepository;

    JobsContentService(JobPostingRepository postingRepository, JobApplicationRepository applicationRepository) {
        this.postingRepository = postingRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId, Optional<Actor> viewer) {
        return switch (screenId) {
            case "home" -> new CatalogScreenContent(
                    "Find the right opportunity",
                    "Browse open jobs, categories, and application status from one discovery surface.",
                    "Jobs",
                    metrics()
                            .add("Open jobs", postingRepository.countByStatus(OPEN))
                            .addFor(viewer, "Your applications", actor -> applicationRepository.countByApplicantId(actor.id()))
                            .build(),
                    List.of(
                            item("browse", "Browse jobs", "Search by title, company, location, and employment type.", "Open jobs", "/jobs/search"),
                            item("filters", "Refine by category", "Narrow jobs by industry, remote preference, and salary range.", "Filters", "/jobs/filters")));
            case "search" -> new CatalogScreenContent(
                    "Search jobs",
                    "Find jobs by title, company, location, employment type, and salary expectations.",
                    "Jobs",
                    List.of(metric("Open jobs", postingRepository.countByStatus(OPEN))),
                    List.of(
                            item("title", "Title and company", "Search by role name, keywords, or employer.", "Core filter", "/jobs"),
                            item("location", "Location and remote", "Filter by city, region, or fully remote preference.", "Trip fit", "/jobs/filters")));
            case "filters" -> new CatalogScreenContent(
                    "Job filters",
                    "Narrow job discovery by category, employment type, salary, and remote flexibility.",
                    "Jobs",
                    List.of(),
                    List.of(
                            item("category", "Industry", "Filter by job category and sub-specialty.", "Category", "/jobs"),
                            item("salary", "Salary range", "Set minimum and maximum compensation expectations.", "Compensation", "/jobs")));
            case "saved" -> new CatalogScreenContent(
                    "Saved jobs",
                    "Track jobs you want to compare, revisit, or apply to later.",
                    "Jobs",
                    List.of(),
                    List.of(item("saved", "Sign in to see saved jobs", "Saved jobs appear here for easy comparison.", "Search jobs", "/jobs/search")));
            case "post" -> new CatalogScreenContent(
                    "Post a job",
                    "Create a job listing with clear expectations, contact handoff, and application details.",
                    "Jobs",
                    personal(viewer, actor -> List.of(metric("Your postings", postingRepository.countByOwnerId(actor.id())))),
                    List.of(
                            item("basics", "Basics", "Title, company, location, and employment type.", "Step 1", "/jobs"),
                            item("details", "Details", "Description, salary, application URL, and contact method.", "Step 2", "/jobs/saved")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }
}
