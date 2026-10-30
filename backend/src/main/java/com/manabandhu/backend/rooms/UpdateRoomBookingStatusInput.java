package com.manabandhu.backend.rooms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateRoomBookingStatusInput(
        @NotBlank @Pattern(regexp = "pending|accepted|rejected|cancelled") String status) {}
