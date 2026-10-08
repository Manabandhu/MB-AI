package com.manabandhu.backend.referrals;

import java.time.Instant;
import java.util.UUID;

/** Referral as shown to a viewer; contact details are included only for the owner and admins. */
public record ReferralView(
        UUID id,
        UUID ownerId,
        String type,
        String status,
        String title,
        String description,
        String category,
        String contactInfo,
        Instant createdAt,
        Instant updatedAt) {

    static ReferralView of(Referral referral, boolean includeContact) {
        return new ReferralView(referral.getId(), referral.getOwnerId(), referral.getType(), referral.getStatus(),
                referral.getTitle(), referral.getDescription(), referral.getCategory(),
                includeContact ? referral.getContactInfo() : null, referral.getCreatedAt(), referral.getUpdatedAt());
    }
}
