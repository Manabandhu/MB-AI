package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateRoomListingInput(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal price,
        @NotBlank @Size(max = 50) String roomType,
        @Size(max = 200) String broadLocation,
        @Size(max = 4000) String exactAddress,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
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

    public CreateRoomListingInput(String title, String description, BigDecimal price, String roomType,
                                  String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude) {
        this(title, description, price, roomType, broadLocation, exactAddress, latitude, longitude,
                "ANY", "ANY", "SHARED", false, BigDecimal.ZERO, BigDecimal.ZERO, "FLEXIBLE", false, null, null, null);
    }
}
