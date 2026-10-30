package com.manabandhu.backend.admin;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/admin/automations")
public class SuperAdminController {

    private final AutomationCatalog catalog;
    private final AutomationService service;
    private final AdminAccessPolicy accessPolicy;
    private final AdminAuditService audit;

    SuperAdminController(
            AutomationCatalog catalog,
            AutomationService service,
            AdminAccessPolicy accessPolicy,
            AdminAuditService audit) {
        this.catalog = catalog;
        this.service = service;
        this.accessPolicy = accessPolicy;
        this.audit = audit;
    }

    @GetMapping
    List<AutomationOperation> operations(Authentication authentication) {
        accessPolicy.require(authentication);
        return catalog.operations();
    }

    @PostMapping("/{operationId}/executions")
    ResponseEntity<AutomationExecution> execute(
            @PathVariable String operationId,
            @Valid @RequestBody ExecuteAutomationRequest input,
            Authentication authentication) {
        accessPolicy.require(authentication);
        var execution = service.execute(operationId, input, accessPolicy.actorId(authentication),
                Actor.from(authentication).map(Actor::superAdmin).orElse(false));
        audit.record(accessPolicy.actorId(authentication), "automation." + operationId, input.environment(),
                execution.executionId().toString());
        return ResponseEntity.accepted().body(execution);
    }
}
