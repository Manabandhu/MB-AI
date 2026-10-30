package com.manabandhu.backend.foundation;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

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
            Authentication authentication
    ) {
        UUID userId = Actor.require(authentication).id();
        return ResponseEntity.ok(onboardingService.getProgress(userId));
    }

    @PostMapping("/step")
    public ResponseEntity<UserOnboardingProgressDto> saveStep(
            @RequestBody SaveStepRequest request,
            Authentication authentication
    ) {
        UUID userId = Actor.require(authentication).id();
        return ResponseEntity.ok(onboardingService.saveStep(userId, request.stepKey(), request.payload()));
    }

    @PostMapping("/complete")
    public ResponseEntity<UserOnboardingProgressDto> completeOnboarding(
            Authentication authentication
    ) {
        UUID userId = Actor.require(authentication).id();
        return ResponseEntity.ok(onboardingService.completeOnboarding(userId));
    }
}
