package com.manabandhu.backend.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAssistantCitationInput(
        @NotBlank @Size(max = 300) String title,
        @Size(max = 500) String url,
        @NotBlank @Size(max = 4000) String snippet) {}
