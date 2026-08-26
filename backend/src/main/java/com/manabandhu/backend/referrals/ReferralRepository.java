package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReferralRepository extends JpaRepository<Referral, UUID> {
    List<Referral> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
