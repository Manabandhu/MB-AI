package com.manabandhu.backend.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageInput(
        @NotBlank @Size(max = 4000) String body,
        @NotBlank String messageType) {}
