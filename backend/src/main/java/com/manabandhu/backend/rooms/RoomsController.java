package com.manabandhu.backend.rooms;

import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomsController {

    private final RoomsContentService service;

    RoomsController(RoomsContentService service) {
        this.service = service;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(@PathVariable String screenId) {
        return service.screen(screenId);
    }
}
