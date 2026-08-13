package com.manabandhu.backend.foundation;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    CatalogScreenContent screen(@org.springframework.web.bind.annotation.PathVariable String screenId) {
        return service.screen(screenId);
    }
}
