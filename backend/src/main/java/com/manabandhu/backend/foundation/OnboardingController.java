package com.manabandhu.backend.foundation;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
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

    private static final UUID DEMO_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

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

    private UUID resolveUserId(Jwt jwt, Authentication authentication) {
        if (jwt != null && jwt.getSubject() != null) {
            try {
                return UUID.fromString(jwt.getSubject());
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        if (authentication != null && authentication.getPrincipal() instanceof Jwt authJwt && authJwt.getSubject() != null) {
            try {
                return UUID.fromString(authJwt.getSubject());
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        return DEMO_USER_ID;
    }
}
