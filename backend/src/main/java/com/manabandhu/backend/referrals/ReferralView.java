package com.manabandhu.backend.referrals;

import java.time.Instant;
import java.util.UUID;

/**
 * Referral as shown to a viewer; contact details are included only for the owner and admins. The anonymous public
 * list ({@link #publicOf}) carries neither contact details nor the owner's user id.
 */
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
        return of(referral, includeContact, true);
    }

    static ReferralView publicOf(Referral referral) {
        return of(referral, false, false);
    }

    private static ReferralView of(Referral referral, boolean includeContact, boolean includeOwner) {
        return new ReferralView(referral.getId(), includeOwner ? referral.getOwnerId() : null, referral.getType(),
                referral.getStatus(),
                referral.getTitle(), referral.getDescription(), referral.getCategory(),
                includeContact ? referral.getContactInfo() : null, referral.getCreatedAt(), referral.getUpdatedAt());
    }
}
