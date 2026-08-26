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

@RestController
@RequestMapping("/api/v1/referrals")
public class ReferralController {

    private final ReferralService referralService;
    private final ReferralRequestService requestService;
    private final ReferralOfferService offerService;

    ReferralController(ReferralService referralService, ReferralRequestService requestService, ReferralOfferService offerService) {
        this.referralService = referralService;
        this.requestService = requestService;
        this.offerService = offerService;
    }

    @GetMapping
    List<Referral> referrals(Authentication authentication) {
        return referralService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @PostMapping
    ResponseEntity<Referral> createReferral(Authentication authentication, @Valid @RequestBody CreateReferralRequestInput input) {
        var referral = referralService.create(UUID.fromString(authentication.getName()), UUID.randomUUID(), "request", input.title(), input.description(), "pending");
        requestService.create(referral.getId(), input.category(), input.details(), input.urgency(), input.desiredOutcome());
        return ResponseEntity.created(URI.create("/api/v1/referrals/" + referral.getId())).body(referral);
    }

    @GetMapping("/{referralId}")
    Referral referral(@PathVariable UUID referralId) {
        return referralService.findById(referralId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral not found"));
    }

    @PatchMapping("/{referralId}/status")
    Referral updateStatus(@PathVariable UUID referralId, @Valid @RequestBody UpdateReferralStatusInput input) {
        return referralService.updateStatus(referralId, input.status());
    }

    @GetMapping("/{referralId}/request")
    ReferralRequest request(@PathVariable UUID referralId) {
        return requestService.findByReferralId(referralId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral request not found"));
    }

    @PostMapping("/{referralId}/offer")
    ResponseEntity<ReferralOffer> createOffer(@PathVariable UUID referralId, @Valid @RequestBody CreateReferralOfferInput input) {
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
