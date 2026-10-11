package com.manabandhu.backend.immigration;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.manabandhu.backend.foundation.CatalogScreenContent;
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
import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/immigration")
public class ImmigrationController {

    private final ImmigrationResourceService resourceService;
    private final ImmigrationGuideService guideService;
    private final ImmigrationChecklistService checklistService;
    private final ImmigrationNewsService newsService;
    private final FaqItemService faqService;
    private final ImmigrationContentService contentService;

    ImmigrationController(ImmigrationResourceService resourceService, ImmigrationGuideService guideService, ImmigrationChecklistService checklistService, ImmigrationNewsService newsService, FaqItemService faqService, ImmigrationContentService contentService) {
        this.resourceService = resourceService;
        this.guideService = guideService;
        this.checklistService = checklistService;
        this.newsService = newsService;
        this.faqService = faqService;
        this.contentService = contentService;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(Authentication authentication, @PathVariable String screenId) {
        return contentService.screen(screenId, Actor.from(authentication));
    }

    @GetMapping("/resources")
    List<ImmigrationResourceView> resources(Authentication authentication, @RequestParam(required = false) String category) {
        return resourceService.listVisible(Actor.from(authentication), category);
    }

    @PostMapping("/resources")
    ResponseEntity<ImmigrationResource> createResource(Authentication authentication, @Valid @RequestBody CreateImmigrationResourceInput input) {
        var type = resourceType(input.resourceType());
        var actor = Actor.require(authentication);
        // Only admins can mark a resource as verified; community submissions start unverified.
        var verified = actor.admin() && input.verified();
        var resource = resourceService.create(actor.id(), input.title(), input.description(), input.category(), input.url(), type, input.tags(), verified);
        return ResponseEntity.created(URI.create("/api/v1/immigration/resources/" + resource.getId())).body(resource);
    }

    private static ImmigrationResource.ResourceType resourceType(String value) {
        try {
            return ImmigrationResource.ResourceType.valueOf(value.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Unknown resource type");
        }
    }

    @GetMapping("/resources/{resourceId}")
    ImmigrationResourceView resource(Authentication authentication, @PathVariable UUID resourceId) {
        return resourceService.viewFor(Actor.from(authentication), resourceId);
    }

    @GetMapping("/guides")
    List<ImmigrationGuide> guides(@RequestParam(required = false) String category) {
        return category != null ? guideService.findByCategory(category) : guideService.findAll();
    }

    @GetMapping("/checklists")
    List<ImmigrationChecklist> checklists(Authentication authentication, @RequestParam(required = false) String category) {
        return checklistService.findForOwner(Actor.require(authentication), category);
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
