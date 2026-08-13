package com.manabandhu.backend.admin;

import java.time.Instant;
import java.util.UUID;

public record AutomationExecution(
        UUID executionId,
        String operationId,
        String status,
        String environment,
        String ref,
        Instant acceptedAt) {}
