package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReferralRepository extends JpaRepository<Referral, UUID> {
    List<Referral> findTop100ByStatusInOrderByCreatedAtDesc(java.util.Collection<String> statuses);

    List<Referral> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    long countByTypeAndStatusIn(String type, java.util.Collection<String> statuses);

    long countByOwnerIdAndType(UUID ownerId, String type);
}
