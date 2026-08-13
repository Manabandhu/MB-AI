package com.manabandhu.backend.admin;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/automations")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final AutomationCatalog catalog;
    private final AutomationService service;

    SuperAdminController(AutomationCatalog catalog, AutomationService service) {
        this.catalog = catalog;
        this.service = service;
    }

    @GetMapping
    List<AutomationOperation> operations() {
        return catalog.operations();
    }

    @PostMapping("/{operationId}/executions")
    ResponseEntity<AutomationExecution> execute(
            @PathVariable String operationId,
            @Valid @RequestBody ExecuteAutomationRequest input,
            Authentication authentication) {
        return ResponseEntity.accepted().body(service.execute(operationId, input, authentication.getName()));
    }
}
