package com.manabandhu.backend.events;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEventAttendanceInput(
        @NotBlank @Size(max = 20) String status) {}
