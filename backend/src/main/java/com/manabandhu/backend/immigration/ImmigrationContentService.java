package com.manabandhu.backend.immigration;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class ImmigrationContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content(
                    "Immigration guidance, curated",
                    "Find resources, guides, checklists, and community answers in one place.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Resources", "18"),
                            new CatalogMetric("Guides", "7")),
                    java.util.List.of(
                            item("resources", "Browse resources", "Find forms, links, and curated USCIS resources.", "Open", "/immigration/resources"),
                            item("guides", "Step-by-step guides", "Follow guided paths for common petitions and applications.", "Guides", "/immigration/guides")));
            case "resources" -> content(
                    "Resources",
                    "Curated immigration resources with citations, freshness, and legal disclaimers.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Categories", "5"),
                            new CatalogMetric("Verified", "12")),
                    java.util.List.of(
                            item("browse", "Browse by category", "Filter resources by type, category, and verification status.", "Categories", "/immigration/faq"),
                            item("detail", "Open a resource", "See description, links, citations, and last-reviewed date.", "Detail", "/immigration/news")));
            case "guides" -> content(
                    "Guides",
                    "Step-by-step immigration guides with checklists and timelines.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Guides", "7"),
                            new CatalogMetric("Steps", "24")),
                    java.util.List.of(
                            item("browse", "Browse guides", "Find guides by category and petition type.", "Guides", "/immigration/checklists"),
                            item("follow", "Follow a guide", "Track your progress through checklist steps.", "Progress", "/immigration/questions")));
            case "checklists" -> content(
                    "Checklists",
                    "Track checklist progress for petitions, filings, and interviews.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Checklists", "9"),
                            new CatalogMetric("Completed", "3")),
                    java.util.List.of(
                            item("browse", "Browse checklists", "Find checklists by category and filing type.", "Checklists", "/immigration/faq"),
                            item("track", "Track progress", "Mark steps complete and track deadlines.", "Progress", "/immigration/news")));
            case "faq" -> content(
                    "FAQ",
                    "Common immigration questions with community-sourced answers.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Questions", "22"),
                            new CatalogMetric("Published", "18")),
                    java.util.List.of(
                            item("browse", "Browse FAQ", "Search questions by category and keyword.", "FAQ", "/immigration/questions"),
                            item("ask", "Ask a question", "Submit a question for community review.", "Ask", "/immigration/uscis")));
            case "questions" -> content(
                    "Community Q&A",
                    "Read and ask immigration questions answered by the community.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Questions", "14"),
                            new CatalogMetric("Answers", "31")),
                    java.util.List.of(
                            item("browse", "Browse questions", "Read questions and answers by category.", "Q&A", "/immigration/faq"),
                            item("ask", "Ask a question", "Submit a new question for community review.", "Ask", "/immigration/uscis")));
            case "uscis" -> content(
                    "USCIS links",
                    "Direct links to USCIS forms, case status, and official guidance.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Links", "12"),
                            new CatalogMetric("Last checked", "This week")),
                    java.util.List.of(
                            item("forms", "Forms", "Browse USCIS forms by category and number.", "Forms", "/immigration/resources"),
                            item("case", "Case status", "Check your case status on the official USCIS site.", "Status", "/immigration/news")));
            case "news" -> content(
                    "Immigration news",
                    "Recent policy updates, guidance, and community announcements.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Articles", "8"),
                            new CatalogMetric("This week", "3")),
                    java.util.List.of(
                            item("browse", "Browse news", "Read recent policy and guidance updates.", "News", "/immigration/resources"),
                            item("save", "Save for later", " bookmark articles for reference and citations.", "Saved", "/immigration/saved")));
            case "saved" -> content(
                    "Saved resources",
                    "Your saved resources, guides, and news articles in one place.",
                    "Immigration",
                    java.util.List.of(
                            new CatalogMetric("Saved", "—")),
                    java.util.List.of(item("saved", "Sign in to see saved resources", "Saved resources appear here for easy reference.", "Browse resources", "/immigration/resources")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                 java.util.List<CatalogMetric> metrics,
                                                 java.util.List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}