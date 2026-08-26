package com.manabandhu.backend.immigration;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/immigration")
public class ImmigrationController {

    private final ImmigrationResourceService resourceService;
    private final ImmigrationGuideService guideService;
    private final ImmigrationChecklistService checklistService;
    private final ImmigrationNewsService newsService;
    private final FaqItemService faqService;

    ImmigrationController(ImmigrationResourceService resourceService, ImmigrationGuideService guideService, ImmigrationChecklistService checklistService, ImmigrationNewsService newsService, FaqItemService faqService) {
        this.resourceService = resourceService;
        this.guideService = guideService;
        this.checklistService = checklistService;
        this.newsService = newsService;
        this.faqService = faqService;
    }

    @GetMapping("/resources")
    List<ImmigrationResource> resources(@RequestParam(required = false) String category) {
        return category != null ? resourceService.findByCategory(category) : resourceService.findAll();
    }

    @PostMapping("/resources")
    ResponseEntity<ImmigrationResource> createResource(Authentication authentication, @Valid @RequestBody CreateImmigrationResourceInput input) {
        var type = ImmigrationResource.ResourceType.valueOf(input.resourceType());
        var resource = resourceService.create(UUID.fromString(authentication.getName()), input.title(), input.description(), input.category(), input.url(), type, input.tags(), input.verified());
        return ResponseEntity.created(URI.create("/api/v1/immigration/resources/" + resource.getId())).body(resource);
    }

    @GetMapping("/guides")
    List<ImmigrationGuide> guides(@RequestParam(required = false) String category) {
        return category != null ? guideService.findByCategory(category) : guideService.findAll();
    }

    @GetMapping("/checklists")
    List<ImmigrationChecklist> checklists(@RequestParam(required = false) String category) {
        return category != null ? checklistService.findByCategory(category) : checklistService.findAll();
    }

    @GetMapping("/faq")
    List<FaqItem> faq(@RequestParam(required = false) String category) {
        return category != null ? faqService.findByCategory(category) : faqService.findAllPublished();
    }

    @GetMapping("/news")
    List<ImmigrationNews> news() {
        return newsService.findAll();
    }
}
