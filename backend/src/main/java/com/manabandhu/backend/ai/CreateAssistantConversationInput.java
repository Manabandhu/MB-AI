package com.manabandhu.backend.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAssistantConversationInput(
        @NotBlank @Size(max = 200) String title) {}
