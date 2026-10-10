package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class ReferralService {

    private final ReferralRepository repository;

    ReferralService(ReferralRepository repository) {
        this.repository = repository;
    }

    /** The 100 newest open referrals, without contact details. */
    @Transactional(readOnly = true)
    public List<ReferralView> listPublic() {
        return repository.findTop100ByStatusInOrderByCreatedAtDesc(ReferralsContentService.OPEN_STATUSES).stream()
                .map(r -> ReferralView.of(r, false)).toList();
    }

    @Transactional(readOnly = true)
    public ReferralView viewFor(Actor actor, UUID id) {
        var referral = requireVisible(actor, id);
        return ReferralView.of(referral, actor.admin() || actor.is(referral.getOwnerId()));
    }

    /**
     * Open referrals are visible to every signed-in member; closed ones only to the owner, the recipient and admins.
     * Hidden referrals read as 404 so their existence is not revealed.
     */
    @Transactional(readOnly = true)
    public Referral requireVisible(Actor actor, UUID id) {
        var referral = require(id);
        if (!canView(actor, referral)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Referral not found");
        }
        return referral;
    }

    static boolean canView(Actor actor, Referral referral) {
        if (actor.admin() || actor.is(referral.getOwnerId())) return true;
        if (referral.getRecipientId() != null && actor.is(referral.getRecipientId())) return true;
        var status = referral.getStatus() == null ? "" : referral.getStatus().toLowerCase(java.util.Locale.ROOT);
        return ReferralsContentService.OPEN_STATUSES.contains(status);
    }

    /** Fails with 403 unless the caller owns the referral or is an admin. */
    @Transactional(readOnly = true)
    public Referral requireOwned(Actor actor, UUID id) {
        var referral = require(id);
        actor.requireOwner(referral.getOwnerId(), "Only the referral owner can do this");
        return referral;
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
    public Referral updateStatus(Actor actor, UUID id, String status) {
        var referral = requireOwned(actor, id);
        referral.status = status.trim().toLowerCase(java.util.Locale.ROOT);
        referral.updatedAt = java.time.Instant.now();
        return repository.save(referral);
    }

    private Referral require(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referral not found"));
    }
}
