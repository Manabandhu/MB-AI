package com.manabandhu.backend.referrals;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralOfferService {

    private final ReferralOfferRepository repository;

    ReferralOfferService(ReferralOfferRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<ReferralOffer> findByReferralId(UUID referralId) {
        return Optional.ofNullable(repository.findByReferralId(referralId));
    }

    @Transactional
    public ReferralOffer create(UUID referralId, String serviceType, String availability, String terms, java.time.Instant expiresAt) {
        return repository.save(new ReferralOffer(referralId, serviceType, availability, terms, expiresAt));
    }
}
