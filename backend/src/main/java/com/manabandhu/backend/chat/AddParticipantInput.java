package com.manabandhu.backend.chat;

import jakarta.validation.constraints.NotBlank;

public record AddParticipantInput(
        @NotBlank String userId) {}
