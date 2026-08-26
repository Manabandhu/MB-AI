package com.manabandhu.backend.jobs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateJobApplicationInput(
        @NotBlank @Size(max = 20) String status) {}
