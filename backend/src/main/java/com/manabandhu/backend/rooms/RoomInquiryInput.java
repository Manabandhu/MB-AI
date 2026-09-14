package com.manabandhu.backend.rooms;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoomInquiryInput(
        @NotNull LocalDate moveInDate,
        Integer stayDurationMonths,
        String dietaryLifestyle,
        @NotBlank @Size(max = 4000) String introMessage) {}
