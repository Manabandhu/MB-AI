package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReferralRequestRepository extends JpaRepository<ReferralRequest, UUID> {
    ReferralRequest findByReferralId(UUID referralId);

    List<ReferralRequest> findByCategoryOrderByCreatedAtDesc(String category);
}
