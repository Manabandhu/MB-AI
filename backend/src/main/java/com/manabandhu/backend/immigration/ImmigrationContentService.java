package com.manabandhu.backend.immigration;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Immigration screens. Counts come from COUNT queries over the immigration tables; checklist progress is the
 * signed-in viewer's own. Screens without a data source (community Q&A, saved) show no metrics.
 */
@Service
class ImmigrationContentService {

    private final ImmigrationResourceRepository resourceRepository;
    private final ImmigrationGuideRepository guideRepository;
    private final ImmigrationChecklistRepository checklistRepository;
    private final FaqItemRepository faqRepository;
    private final ImmigrationNewsRepository newsRepository;
    private final Clock clock;

    @Autowired
    ImmigrationContentService(ImmigrationResourceRepository resourceRepository, ImmigrationGuideRepository guideRepository,
                              ImmigrationChecklistRepository checklistRepository, FaqItemRepository faqRepository,
                              ImmigrationNewsRepository newsRepository) {
        this(resourceRepository, guideRepository, checklistRepository, faqRepository, newsRepository, Clock.systemUTC());
    }

    ImmigrationContentService(ImmigrationResourceRepository resourceRepository, ImmigrationGuideRepository guideRepository,
                              ImmigrationChecklistRepository checklistRepository, FaqItemRepository faqRepository,
                              ImmigrationNewsRepository newsRepository, Clock clock) {
        this.resourceRepository = resourceRepository;
        this.guideRepository = guideRepository;
        this.checklistRepository = checklistRepository;
        this.faqRepository = faqRepository;
        this.newsRepository = newsRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId, Optional<Actor> viewer) {
        return switch (screenId) {
            case "home" -> content(
                    "Immigration guidance, curated",
                    "Find resources, guides, checklists, and community answers in one place.",
                    "Immigration",
                    List.of(
                            metric("Resources", resourceRepository.count()),
                            metric("Guides", guideRepository.count())),
                    List.of(
                            item("resources", "Browse resources", "Find forms, links, and curated USCIS resources.", "Open", "/immigration/resources"),
                            item("guides", "Step-by-step guides", "Follow guided paths for common petitions and applications.", "Guides", "/immigration/guides")));
            case "resources" -> content(
                    "Resources",
                    "Curated immigration resources with citations, freshness, and legal disclaimers.",
                    "Immigration",
                    List.of(
                            metric("Categories", resourceRepository.countDistinctCategories()),
                            metric("Verified", resourceRepository.countByVerifiedTrue())),
                    List.of(
                            item("browse", "Browse by category", "Filter resources by type, category, and verification status.", "Categories", "/immigration/faq"),
                            item("detail", "Open a resource", "See description, links, citations, and last-reviewed date.", "Detail", "/immigration/news")));
            case "guides" -> content(
                    "Guides",
                    "Step-by-step immigration guides with checklists and timelines.",
                    "Immigration",
                    List.of(
                            metric("Guides", guideRepository.count()),
                            metric("Categories", guideRepository.countDistinctCategories())),
                    List.of(
                            item("browse", "Browse guides", "Find guides by category and petition type.", "Guides", "/immigration/checklists"),
                            item("follow", "Follow a guide", "Track your progress through checklist steps.", "Progress", "/immigration/questions")));
            case "checklists" -> content(
                    "Checklists",
                    "Track checklist progress for petitions, filings, and interviews.",
                    "Immigration",
                    checklistMetrics(viewer),
                    List.of(
                            item("browse", "Browse checklists", "Find checklists by category and filing type.", "Checklists", "/immigration/faq"),
                            item("track", "Track progress", "Mark steps complete and track deadlines.", "Progress", "/immigration/news")));
            case "faq" -> content(
                    "FAQ",
                    "Common immigration questions with community-sourced answers.",
                    "Immigration",
                    List.of(
                            metric("Questions", faqRepository.count()),
                            metric("Published", faqRepository.countByPublishedTrue())),
                    List.of(
                            item("browse", "Browse FAQ", "Search questions by category and keyword.", "FAQ", "/immigration/questions"),
                            item("ask", "Ask a question", "Submit a question for community review.", "Ask", "/immigration/uscis")));
            case "questions" -> content(
                    "Community Q&A",
                    "Read and ask immigration questions answered by the community.",
                    "Immigration",
                    List.of(),
                    List.of(
                            item("browse", "Browse questions", "Read questions and answers by category.", "Q&A", "/immigration/faq"),
                            item("ask", "Ask a question", "Submit a new question for community review.", "Ask", "/immigration/uscis")));
            case "uscis" -> content(
                    "USCIS links",
                    "Direct links to USCIS forms, case status, and official guidance.",
                    "Immigration",
                    List.of(metric("Links", resourceRepository.countByUrlContainingIgnoreCase("uscis.gov"))),
                    List.of(
                            item("forms", "Forms", "Browse USCIS forms by category and number.", "Forms", "/immigration/resources"),
                            item("case", "Case status", "Check your case status on the official USCIS site.", "Status", "/immigration/news")));
            case "news" -> content(
                    "Immigration news",
                    "Recent policy updates, guidance, and community announcements.",
                    "Immigration",
                    List.of(
                            metric("Articles", newsRepository.count()),
                            metric("This week", newsRepository.countByPublishedAtAfter(Instant.now(clock).minus(Duration.ofDays(7))))),
                    List.of(
                            item("browse", "Browse news", "Read recent policy and guidance updates.", "News", "/immigration/resources"),
                            item("save", "Save for later", "Bookmark articles for reference and citations.", "Saved", "/immigration/saved")));
            case "saved" -> content(
                    "Saved resources",
                    "Your saved resources, guides, and news articles in one place.",
                    "Immigration",
                    List.of(),
                    List.of(item("saved", "Sign in to see saved resources", "Saved resources appear here for easy reference.", "Browse resources", "/immigration/resources")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private List<CatalogMetric> checklistMetrics(Optional<Actor> viewer) {
        var total = metric("Checklists", checklistRepository.count());
        return viewer.map(actor -> List.of(total,
                        metric("Yours", checklistRepository.countByOwnerId(actor.id())),
                        metric("Completed", checklistRepository.countByOwnerIdAndCompletedAtIsNotNull(actor.id()))))
                .orElse(List.of(total));
    }

    private static CatalogMetric metric(String label, long value) {
        return new CatalogMetric(label, String.valueOf(value));
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                 List<CatalogMetric> metrics,
                                                 List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}