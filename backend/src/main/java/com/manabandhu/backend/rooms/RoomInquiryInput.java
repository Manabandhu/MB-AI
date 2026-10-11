package com.manabandhu.backend.rooms;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * {@code stayDurationMonths} is null when the guest is flexible. {@code moveInDate} is the guest's local date, so the
 * service checks it against the earliest time zone rather than the server's.
 */
public record RoomInquiryInput(
        @NotNull LocalDate moveInDate,
        @Min(1) @Max(36) Integer stayDurationMonths,
        @Size(max = 50) String dietaryLifestyle,
        @NotBlank @Size(max = 4000) String introMessage) {}
