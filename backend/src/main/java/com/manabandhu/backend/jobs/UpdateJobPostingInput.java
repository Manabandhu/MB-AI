package com.manabandhu.backend.jobs;

import java.math.BigDecimal;

import java.util.UUID;

import jakarta.validation.constraints.Size;

public record UpdateJobPostingInput(
        UUID categoryId,
        @Size(max = 200) String title,
        @Size(max = 200) String company,
        @Size(max = 200) String location,
        @Size(max = 4000) String description,
        @Size(max = 50) String employmentType,
        Boolean isRemote,
        Integer salaryMin,
        Integer salaryMax,
        @Size(max = 500) String applicationUrl,
        @Size(max = 20) String status) {}
