package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Partial update: {@code null} leaves a field unchanged; {@code amenities} replaces the whole set when present. */
public record UpdateRoomListingInput(
        @Size(max = 200) @Pattern(regexp = RoomInputRules.NOT_BLANK) String title,
        @Size(max = 4000) String description,
        @Positive @Digits(integer = 8, fraction = 2) BigDecimal price,
        @Size(max = 50) @Pattern(regexp = RoomInputRules.NOT_BLANK) String roomType,
        @Size(max = 200) String broadLocation,
        @Size(max = 4000) String exactAddress,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
        @Size(max = 20) String status,
        @Pattern(regexp = RoomInputRules.DIET) String dietaryPreference,
        @Pattern(regexp = RoomInputRules.GENDER) String genderPreference,
        @Pattern(regexp = RoomInputRules.BATHROOM) String bathroomType,
        Boolean utilitiesIncluded,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal estUtilityMonthly,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal securityDeposit,
        @Pattern(regexp = RoomInputRules.LEASE) String leaseTerm,
        Boolean universityShuttleAccessible,
        @Size(max = 50) String stateCode,
        @Size(max = 100) String county,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> amenities) {

    public UpdateRoomListingInput(String title, String description, BigDecimal price, String roomType,
                                  String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude, String status) {
        this(title, description, price, roomType, broadLocation, exactAddress, latitude, longitude, status,
                null, null, null, null, null, null, null, null, null, null, null);
    }
}
