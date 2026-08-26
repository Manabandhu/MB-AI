package com.manabandhu.backend.rides;

import jakarta.validation.constraints.Size;

public record UpdateRideRequestStatusInput(
        @Size(max = 20) String status) {}
