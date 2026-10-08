package com.manabandhu.backend.referrals;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/referrals")
public class ReferralController {

    private final ReferralService referralService;
    private final ReferralRequestService requestService;
    private final ReferralOfferService offerService;
    private final ReferralsContentService contentService;

    ReferralController(ReferralService referralService, ReferralRequestService requestService, ReferralOfferService offerService, ReferralsContentService contentService) {
        this.referralService = referralService;
        this.requestService = requestService;
        this.offerService = offerService;
        this.contentService = contentService;
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping
    List<Referral> referrals(Authentication authentication) {
        return referralService.findByOwner(Actor.require(authentication).id());
    }

    @GetMapping("/public")
    List<ReferralView> publicReferrals() {
        return referralService.listPublic();
    }

    @PostMapping
    ResponseEntity<Referral> createReferral(Authentication authentication, @Valid @RequestBody CreateReferralRequestInput input) {
        var referral = referralService.create(Actor.require(authentication).id(), null, "request", input.title(), input.description(), "pending");
        requestService.create(referral.getId(), input.category(), input.details(), input.urgency(), input.desiredOutcome());
        return ResponseEntity.created(URI.create("/api/v1/referrals/" + referral.getId())).body(referral);
    }

    /** Creates an "offer" referral (someone offering to refer others) with its offer details. */
    @PostMapping("/offer")
    ResponseEntity<Referral> createOfferReferral(Authentication authentication, @Valid @RequestBody CreateReferralOfferInput input) {
        var referral = referralService.create(Actor.require(authentication).id(), null, "offer", input.title(), input.description(), "pending");
        offerService.create(referral.getId(), input.serviceType(), input.availability(), input.terms(), input.expiresAt());
        return ResponseEntity.created(URI.create("/api/v1/referrals/" + referral.getId())).body(referral);
    }

    @GetMapping("/{referralId}")
    ReferralView referral(Authentication authentication, @PathVariable UUID referralId) {
        return referralService.viewFor(Actor.require(authentication), referralId);
    }

    @PatchMapping("/{referralId}/status")
    Referral updateStatus(Authentication authentication, @PathVariable UUID referralId, @Valid @RequestBody UpdateReferralStatusInput input) {
        return referralService.updateStatus(Actor.require(authentication), referralId, input.status());
    }

    @GetMapping("/{referralId}/request")
    ReferralRequest request(@PathVariable UUID referralId) {
        return requestService.findByReferralId(referralId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral request not found"));
    }

    @PostMapping("/{referralId}/offer")
    ResponseEntity<ReferralOffer> createOffer(Authentication authentication, @PathVariable UUID referralId, @Valid @RequestBody CreateReferralOfferInput input) {
        referralService.requireOwned(Actor.require(authentication), referralId);
        var offer = offerService.create(referralId, input.serviceType(), input.availability(), input.terms(), input.expiresAt());
        return ResponseEntity.created(URI.create("/api/v1/referrals/offers/" + offer.getId())).body(offer);
    }

    @GetMapping("/{referralId}/offer")
    ReferralOffer offer(@PathVariable UUID referralId) {
        return offerService.findByReferralId(referralId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral offer not found"));
    }
}
