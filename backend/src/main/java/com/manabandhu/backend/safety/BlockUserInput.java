package com.manabandhu.backend.safety;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlockUserInput(
        @NotBlank String blockedUserId,
        @Size(max = 500) String reason) {}
