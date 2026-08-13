package com.manabandhu.backend.notifications;

import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsController {

    private final NotificationsContentService service;

    NotificationsController(NotificationsContentService service) {
        this.service = service;
    }

    @GetMapping("/inbox")
    CatalogScreenContent inbox() {
        return service.inbox();
    }
}
