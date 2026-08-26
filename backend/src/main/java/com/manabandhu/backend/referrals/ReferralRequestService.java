package com.manabandhu.backend.referrals;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralRequestService {

    private final ReferralRequestRepository repository;

    ReferralRequestService(ReferralRequestRepository repository) {
        this.repository = repository;
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
