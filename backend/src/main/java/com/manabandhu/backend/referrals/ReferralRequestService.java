package com.manabandhu.backend.referrals;

import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralRequestService {

    private final ReferralRequestRepository repository;

    private final ReferralService referralService;

    ReferralRequestService(ReferralRequestRepository repository, ReferralService referralService) {
        this.repository = repository;
        this.referralService = referralService;
    }

    /** The details of a referral the caller may see ({@link ReferralService#requireVisible}); 404 otherwise. */
    @Transactional(readOnly = true)
    public Optional<ReferralRequest> findForViewer(Actor actor, UUID referralId) {
        referralService.requireVisible(actor, referralId);
        return findByReferralId(referralId);
    }

    @Transactional(readOnly = true)
    public Optional<ReferralRequest> findByReferralId(UUID referralId) {
        return Optional.ofNullable(repository.findByReferralId(referralId));
    }

    @Transactional
    public ReferralRequest create(UUID referralId, String category, String details, String urgency, String desiredOutcome) {
        return repository.save(new ReferralRequest(referralId, category, details, urgency, desiredOutcome));
    }
}
