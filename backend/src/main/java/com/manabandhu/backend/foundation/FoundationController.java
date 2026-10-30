package com.manabandhu.backend.foundation;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.catalog.CatalogScreenContent;

@RestController
@RequestMapping("/api/v1/foundation")
public class FoundationController {

    private final FoundationContentService service;

    FoundationController(FoundationContentService service) {
        this.service = service;
    }

    @GetMapping("/welcome")
    WelcomeFlow welcome() {
        return service.welcomeFlow();
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(Authentication authentication,
                                @org.springframework.web.bind.annotation.PathVariable String screenId) {
        return service.screen(screenId, Actor.from(authentication));
    }
}
