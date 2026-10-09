package com.manabandhu.backend.jobs;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            case "home" -> {
                var metrics = new ArrayList<CatalogMetric>();
                metrics.add(metric("Open jobs", postingRepository.countByStatus(OPEN)));
                viewer.ifPresent(actor -> metrics.add(metric("Your applications", applicationRepository.countByApplicantId(actor.id()))));
                yield content(
                        "Find the right opportunity",
                        "Browse open jobs, categories, and application status from one discovery surface.",
                        "Jobs",
                        List.copyOf(metrics),
                        List.of(
                                item("browse", "Browse jobs", "Search by title, company, location, and employment type.", "Open jobs", "/jobs/search"),
                                item("filters", "Refine by category", "Narrow jobs by industry, remote preference, and salary range.", "Filters", "/jobs/filters")));
            }
            case "search" -> content(
                    "Search jobs",
                    "Find jobs by title, company, location, employment type, and salary expectations.",
                    "Jobs",
                    List.of(metric("Open jobs", postingRepository.countByStatus(OPEN))),
                    List.of(
                            item("title", "Title and company", "Search by role name, keywords, or employer.", "Core filter", "/jobs"),
                            item("location", "Location and remote", "Filter by city, region, or fully remote preference.", "Trip fit", "/jobs/filters")));
            case "filters" -> content(
                    "Job filters",
                    "Narrow job discovery by category, employment type, salary, and remote flexibility.",
                    "Jobs",
                    List.of(),
                    List.of(
                            item("category", "Industry", "Filter by job category and sub-specialty.", "Category", "/jobs"),
                            item("salary", "Salary range", "Set minimum and maximum compensation expectations.", "Compensation", "/jobs")));
            case "saved" -> content(
                    "Saved jobs",
                    "Track jobs you want to compare, revisit, or apply to later.",
                    "Jobs",
                    List.of(),
                    List.of(item("saved", "Sign in to see saved jobs", "Saved jobs appear here for easy comparison.", "Search jobs", "/jobs/search")));
            case "post" -> content(
                    "Post a job",
                    "Create a job listing with clear expectations, contact handoff, and application details.",
                    "Jobs",
                    viewer.map(actor -> List.of(metric("Your postings", postingRepository.countByOwnerId(actor.id()))))
                            .orElse(List.of()),
                    List.of(
                            item("basics", "Basics", "Title, company, location, and employment type.", "Step 1", "/jobs"),
                            item("details", "Details", "Description, salary, application URL, and contact method.", "Step 2", "/jobs/saved")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogMetric metric(String label, long value) {
        return new CatalogMetric(label, String.valueOf(value));
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
