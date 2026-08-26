package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class ReferralGraphqlController {

    private final ReferralService referralService;
    private final ReferralRequestService requestService;
    private final ReferralOfferService offerService;

    ReferralGraphqlController(ReferralService referralService, ReferralRequestService requestService, ReferralOfferService offerService) {
        this.referralService = referralService;
        this.requestService = requestService;
        this.offerService = offerService;
    }

    @QueryMapping
    List<Referral> referrals(Authentication authentication) {
        return referralService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @QueryMapping
    Referral referral(@Argument UUID id) {
        return referralService.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral not found"));
    }

    @QueryMapping
    ReferralRequest referralRequest(@Argument UUID referralId) {
        return requestService.findByReferralId(referralId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral request not found"));
    }

    @QueryMapping
    ReferralOffer referralOffer(@Argument UUID referralId) {
        return offerService.findByReferralId(referralId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Referral offer not found"));
    }

    @MutationMapping
    Referral createReferralRequest(Authentication authentication, @Argument @Valid CreateReferralRequestInput input) {
        var referral = referralService.create(UUID.fromString(authentication.getName()), UUID.randomUUID(), "request", input.title(), input.description(), "pending");
        requestService.create(referral.getId(), input.category(), input.details(), input.urgency(), input.desiredOutcome());
        return referral;
    }

    @MutationMapping
    Referral createReferralOffer(Authentication authentication, @Argument @Valid CreateReferralOfferInput input) {
        var referral = referralService.create(UUID.fromString(authentication.getName()), UUID.randomUUID(), "offer", input.title(), input.description(), "pending");
        offerService.create(referral.getId(), input.serviceType(), input.availability(), input.terms(), input.expiresAt());
        return referral;
    }

    @MutationMapping
    Referral updateReferralStatus(@Argument UUID id, @Argument @Valid UpdateReferralStatusInput input) {
        return referralService.updateStatus(id, input.status());
    }
}
