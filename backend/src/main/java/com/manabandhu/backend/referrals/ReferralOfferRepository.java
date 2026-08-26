package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReferralOfferRepository extends JpaRepository<ReferralOffer, UUID> {
    ReferralOffer findByReferralId(UUID referralId);

    List<ReferralOffer> findByServiceTypeOrderByCreatedAtDesc(String serviceType);
}
