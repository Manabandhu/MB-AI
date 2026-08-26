package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface TrustedContactRepository extends JpaRepository<TrustedContact, UUID> {
    List<TrustedContact> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
