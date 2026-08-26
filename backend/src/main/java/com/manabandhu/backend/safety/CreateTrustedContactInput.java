package com.manabandhu.backend.safety;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTrustedContactInput(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 20) String phone,
        @Size(max = 200) String email,
        @Size(max = 120) String relationship) {}
