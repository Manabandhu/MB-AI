package com.manabandhu.backend.admin;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
class AutomationService {

    private static final Logger log = LoggerFactory.getLogger(AutomationService.class);
    private static final java.util.regex.Pattern PRODUCTION_REF =
            java.util.regex.Pattern.compile("^(main|refs/heads/main|v\\d+\\.\\d+\\.\\d+[A-Za-z0-9.-]*|refs/tags/v\\d+\\.\\d+\\.\\d+[A-Za-z0-9.-]*)$");

    private final AutomationCatalog catalog;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final String repository;
    private final String token;
    private final JsonMapper objectMapper = JsonMapper.shared();

    AutomationService(
            AutomationCatalog catalog,
            @Value("${app.automation.github.repository:}") String repository,
            @Value("${app.automation.github.token:}") String token) {
        this.catalog = catalog;
        this.repository = repository;
        this.token = token;
    }

    AutomationExecution execute(String operationId, ExecuteAutomationRequest input, String actorId, boolean superAdmin) {
        var definition = catalog.require(operationId);
        if ("production".equals(input.environment())) {
            // Production changes are reserved for SUPER_ADMIN and must ship reviewed code: main or a release tag.
            if (!superAdmin) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Production automations require the SUPER_ADMIN role");
            }
            if (!PRODUCTION_REF.matcher(input.ref()).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Production runs must use main or a v* release tag");
            }
        }
        if (!definition.operation().configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Automation provider is not configured");
        }
        if (definition.operation().requiresConfirmation() && !input.confirmed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Explicit confirmation is required");
        }

        var executionId = UUID.randomUUID();
        dispatch(definition.workflow(), input, actorId, executionId);
        log.info(
                "automation_dispatched execution_id={} operation={} actor={} environment={} ref={}",
                executionId,
                operationId,
                actorId,
                input.environment(),
                input.ref());
        return new AutomationExecution(
                executionId, operationId, "accepted", input.environment(), input.ref(), Instant.now());
    }

    private void dispatch(
            String workflow,
            ExecuteAutomationRequest input,
            String actorId,
            UUID executionId) {
        var body = writePayload(input, actorId, executionId);
        var request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.github.com/repos/" + repository + "/actions/workflows/" + workflow + "/dispatches"))
                .header("Accept", "application/vnd.github+json")
                .header("Authorization", "Bearer " + token)
                .header("X-GitHub-Api-Version", "2022-11-28")
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        try {
            var response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() != 204) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Automation provider rejected the dispatch");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Automation dispatch interrupted", exception);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Automation provider unavailable", exception);
        }
    }

    private String writePayload(ExecuteAutomationRequest input, String actorId, UUID executionId) {
        try {
            var payload = Map.of(
                    "ref", input.ref(),
                    "inputs", Map.of(
                            "environment", input.environment(),
                            "reason", input.reason(),
                            "actor_id", actorId,
                            "execution_id", executionId.toString()
                    )
            );
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to serialize automation payload", exception);
        }
    }
}
