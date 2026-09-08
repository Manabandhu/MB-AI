package com.manabandhu.backend.jobs;

import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class JobsContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content(
                    "Find the right opportunity",
                    "Browse open jobs, categories, and application status from one discovery surface.",
                    "Jobs",
                    java.util.List.of(
                            new com.manabandhu.backend.foundation.CatalogMetric("Open jobs", "24"),
                            new com.manabandhu.backend.foundation.CatalogMetric("Applications", "6")),
                    java.util.List.of(
                            item("browse", "Browse jobs", "Search by title, company, location, and employment type.", "Open jobs", "/jobs/search"),
                            item("filters", "Refine by category", "Narrow jobs by industry, remote preference, and salary range.", "Filters", "/jobs/filters")));
            case "search" -> content(
                    "Search jobs",
                    "Find jobs by title, company, location, employment type, and salary expectations.",
                    "Jobs",
                    java.util.List.of(
                            new com.manabandhu.backend.foundation.CatalogMetric("Filters", "6"),
                            new com.manabandhu.backend.foundation.CatalogMetric("Saved searches", "2")),
                    java.util.List.of(
                            item("title", "Title and company", "Search by role name, keywords, or employer.", "Core filter", "/jobs"),
                            item("location", "Location and remote", "Filter by city, region, or fully remote preference.", "Trip fit", "/jobs/filters")));
            case "filters" -> content(
                    "Job filters",
                    "Narrow job discovery by category, employment type, salary, and remote flexibility.",
                    "Jobs",
                    java.util.List.of(
                            new com.manabandhu.backend.foundation.CatalogMetric("Active filters", "3"),
                            new com.manabandhu.backend.foundation.CatalogMetric("Matches", "9")),
                    java.util.List.of(
                            item("category", "Industry", "Filter by job category and sub-specialty.", "Category", "/jobs"),
                            item("salary", "Salary range", "Set minimum and maximum compensation expectations.", "Compensation", "/jobs")));
            case "saved" -> content(
                    "Saved jobs",
                    "Track jobs you want to compare, revisit, or apply to later.",
                    "Jobs",
                    java.util.List.of(
                            new com.manabandhu.backend.foundation.CatalogMetric("Saved", "—")),
                    java.util.List.of(item("saved", "Sign in to see saved jobs", "Saved jobs appear here for easy comparison.", "Search jobs", "/jobs/search")));
            case "post" -> content(
                    "Post a job",
                    "Create a job listing with clear expectations, contact handoff, and application details.",
                    "Jobs",
                    java.util.List.of(
                            new com.manabandhu.backend.foundation.CatalogMetric("Steps", "4"),
                            new com.manabandhu.backend.foundation.CatalogMetric("Required fields", "7")),
                    java.util.List.of(
                            item("basics", "Basics", "Title, company, location, and employment type.", "Step 1", "/jobs"),
                            item("details", "Details", "Description, salary, application URL, and contact method.", "Step 2", "/jobs/saved")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                 java.util.List<com.manabandhu.backend.foundation.CatalogMetric> metrics,
                                                 java.util.List<com.manabandhu.backend.foundation.CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static com.manabandhu.backend.foundation.CatalogItem item(String id, String title, String body,
                                                                       String meta, String route) {
        return new com.manabandhu.backend.foundation.CatalogItem(id, title, body, meta, route, null);
    }
}