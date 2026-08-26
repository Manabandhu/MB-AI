package com.manabandhu.backend.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendAssistantMessageInput(
        @NotBlank @Size(max = 4000) String content) {}
