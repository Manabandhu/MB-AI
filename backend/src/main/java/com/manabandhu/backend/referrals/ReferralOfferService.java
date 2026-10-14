package com.manabandhu.backend.referrals;

import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralOfferService {

    private final ReferralOfferRepository repository;

    private final ReferralService referralService;

    ReferralOfferService(ReferralOfferRepository repository, ReferralService referralService) {
        this.repository = repository;
        this.referralService = referralService;
    }

    /** The details of a referral the caller may see ({@link ReferralService#requireVisible}); 404 otherwise. */
    @Transactional(readOnly = true)
    public Optional<ReferralOffer> findForViewer(Actor actor, UUID referralId) {
        referralService.requireVisible(actor, referralId);
        return findByReferralId(referralId);
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
