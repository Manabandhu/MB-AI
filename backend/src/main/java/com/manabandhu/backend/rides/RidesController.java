package com.manabandhu.backend.rides;

import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rides")
public class RidesController {

    private final RidesContentService service;

    RidesController(RidesContentService service) {
        this.service = service;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(@PathVariable String screenId) {
        return service.screen(screenId);
    }
}
