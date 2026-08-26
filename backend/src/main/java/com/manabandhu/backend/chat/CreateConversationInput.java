package com.manabandhu.backend.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateConversationInput(
        @NotBlank String type,
        @Size(max = 200) String title) {}
