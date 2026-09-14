package com.manabandhu.backend.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

class OnboardingControllerTest {

    private OnboardingService onboardingService;
    private OnboardingController controller;

    private static final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        onboardingService = mock(OnboardingService.class);
        controller = new OnboardingController(onboardingService);
    }

    private static Authentication authWith(Jwt jwt) {
        return new AbstractAuthenticationToken(List.of()) {
            @Override
            public Object getCredentials() {
                return null;
            }
            @Override
            public Object getPrincipal() {
                return jwt;
            }
            @Override
            public String getName() {
                return jwt.getSubject();
            }
        };
    }

    private static Jwt jwtWith(String subject) {
        return new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of("sub", subject));
    }

    @Test
    void testGetConfig() {
        var options = List.of(new OnboardingOptionDto(
                UUID.randomUUID(), "goals", "housing", "Find Housing", "Browse rooms", "home", "housing", 1, Map.of()
        ));
        var step = new OnboardingStepDto("goals", 1, "What brings you?", "Select one", true, true, options);
        when(onboardingService.getConfig()).thenReturn(new OnboardingConfigResponse(List.of(step)));

        ResponseEntity<OnboardingConfigResponse> response = controller.getConfig();

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().steps()).hasSize(1);
        assertThat(response.getBody().steps().get(0).stepKey()).isEqualTo("goals");
        assertThat(response.getBody().steps().get(0).options()).hasSize(1);
    }

    @Test
    void testGetProgressAuthenticated() {
        var jwt = jwtWith(TEST_USER_ID.toString());
        var auth = authWith(jwt);

        var expected = new UserOnboardingProgressDto(
                TEST_USER_ID, "goals", false, List.of("housing"),
                "DFW", "75019", "UT Dallas", "telugu",
                List.of("english"), List.of("sublease_alerts"),
                null, "Hello", Map.of("emergency_sos", true),
                true, null, Instant.now()
        );
        when(onboardingService.getProgress(TEST_USER_ID)).thenReturn(expected);

        ResponseEntity<UserOnboardingProgressDto> response = controller.getProgress(jwt, auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().userId()).isEqualTo(TEST_USER_ID);
        assertThat(response.getBody().metroLocation()).isEqualTo("DFW");
    }

    @Test
    void testSaveStep() {
        var jwt = jwtWith(TEST_USER_ID.toString());
        var auth = authWith(jwt);

        var request = new SaveStepRequest("goals", Map.of("selectedReasons", List.of("housing", "rides")));
        var updated = new UserOnboardingProgressDto(
                TEST_USER_ID, "goals", false, List.of("housing", "rides"),
                null, null, null, null, List.of(), List.of(), null, null, Map.of(), false, null, Instant.now()
        );
        when(onboardingService.saveStep(eq(TEST_USER_ID), eq("goals"), any())).thenReturn(updated);

        ResponseEntity<UserOnboardingProgressDto> response = controller.saveStep(request, jwt, auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().selectedReasons()).containsExactly("housing", "rides");
    }

    @Test
    void testCompleteOnboarding() {
        var jwt = jwtWith(TEST_USER_ID.toString());
        var auth = authWith(jwt);

        var completed = new UserOnboardingProgressDto(
                TEST_USER_ID, "complete", true, List.of("housing"),
                "DFW", null, null, "telugu", List.of(), List.of(), null, null, Map.of(), true, Instant.now(), Instant.now()
        );
        when(onboardingService.completeOnboarding(TEST_USER_ID)).thenReturn(completed);

        ResponseEntity<UserOnboardingProgressDto> response = controller.completeOnboarding(jwt, auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isCompleted()).isTrue();
        assertThat(response.getBody().currentStep()).isEqualTo("complete");
    }
}
