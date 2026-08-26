package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralService {

    private final ReferralRepository repository;

    ReferralService(ReferralRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Referral> findAll() {
        return repository.findByOwnerIdOrderByCreatedAtDesc(null);
    }

    @Transactional(readOnly = true)
    public List<Referral> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public Optional<Referral> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public Referral create(UUID ownerId, UUID recipientId, String type, String title, String description, String status) {
        return repository.save(new Referral(ownerId, recipientId, type, title, description, status));
    }

    @Transactional
    public Referral updateStatus(UUID id, String status) {
        var referral = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral not found"));
        referral.status = status;
        referral.updatedAt = java.time.Instant.now();
        return repository.save(referral);
    }
}
