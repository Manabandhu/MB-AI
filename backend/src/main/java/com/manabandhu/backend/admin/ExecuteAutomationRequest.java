package com.manabandhu.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ExecuteAutomationRequest(
        @NotBlank @Pattern(regexp = "^(development|staging|production)$") String environment,
        @NotBlank @Size(max = 200) String ref,
        @NotBlank @Size(min = 10, max = 500) String reason,
        boolean confirmed) {}
