package com.manabandhu.backend.jobs;

import jakarta.validation.constraints.Size;

public record CreateJobApplicationInput(
        @Size(max = 4000) String coverLetter,
        @Size(max = 500) String resumeUrl) {}
