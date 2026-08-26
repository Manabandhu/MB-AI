package com.manabandhu.backend.immigration;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class ImmigrationGraphqlController {

    private final ImmigrationResourceService resourceService;
    private final ImmigrationGuideService guideService;
    private final ImmigrationChecklistService checklistService;
    private final ImmigrationNewsService newsService;
    private final FaqItemService faqService;

    ImmigrationGraphqlController(ImmigrationResourceService resourceService, ImmigrationGuideService guideService, ImmigrationChecklistService checklistService, ImmigrationNewsService newsService, FaqItemService faqService) {
        this.resourceService = resourceService;
        this.guideService = guideService;
        this.checklistService = checklistService;
        this.newsService = newsService;
        this.faqService = faqService;
    }

    @QueryMapping
    List<ImmigrationResource> immigrationResources(@Argument String category) {
        return category != null ? resourceService.findByCategory(category) : resourceService.findAll();
    }

    @MutationMapping
    ImmigrationResource createImmigrationResource(Authentication authentication, @Argument @Valid CreateImmigrationResourceInput input) {
        var type = ImmigrationResource.ResourceType.valueOf(input.resourceType());
        return resourceService.create(UUID.fromString(authentication.getName()), input.title(), input.description(), input.category(), input.url(), type, input.tags(), input.verified());
    }

    @QueryMapping
    List<ImmigrationGuide> immigrationGuides(@Argument String category) {
        return category != null ? guideService.findByCategory(category) : guideService.findAll();
    }

    @QueryMapping
    List<ImmigrationChecklist> immigrationChecklists(@Argument String category) {
        return category != null ? checklistService.findByCategory(category) : checklistService.findAll();
    }

    @QueryMapping
    List<FaqItem> faqItems(@Argument String category) {
        return category != null ? faqService.findByCategory(category) : faqService.findAllPublished();
    }

    @QueryMapping
    List<ImmigrationNews> immigrationNews() {
        return newsService.findAll();
    }
}
