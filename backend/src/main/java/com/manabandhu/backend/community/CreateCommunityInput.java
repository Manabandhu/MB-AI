package com.manabandhu.backend.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommunityInput(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 4000) String description) {}
