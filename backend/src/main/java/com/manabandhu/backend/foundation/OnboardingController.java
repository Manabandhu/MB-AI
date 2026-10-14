package com.manabandhu.backend.foundation;

import java.util.UUID;

import org.springframework.http.ResponseEntity;

import com.manabandhu.backend.auth.Actor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/config")
    public ResponseEntity<OnboardingConfigResponse> getConfig() {
        return ResponseEntity.ok(onboardingService.getConfig());
    }

    @GetMapping("/progress")
    public ResponseEntity<UserOnboardingProgressDto> getProgress(
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication
    ) {
        UUID userId = resolveUserId(jwt, authentication);
        return ResponseEntity.ok(onboardingService.getProgress(userId));
    }

    @PostMapping("/step")
    public ResponseEntity<UserOnboardingProgressDto> saveStep(
            @RequestBody SaveStepRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication
    ) {
        UUID userId = resolveUserId(jwt, authentication);
        return ResponseEntity.ok(onboardingService.saveStep(userId, request.stepKey(), request.payload()));
    }

    @PostMapping("/complete")
    public ResponseEntity<UserOnboardingProgressDto> completeOnboarding(
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication
    ) {
        UUID userId = resolveUserId(jwt, authentication);
        return ResponseEntity.ok(onboardingService.completeOnboarding(userId));
    }

    private static UUID resolveUserId(Jwt jwt, Authentication authentication) {
        return Actor.require(authentication).id();
    }
}
