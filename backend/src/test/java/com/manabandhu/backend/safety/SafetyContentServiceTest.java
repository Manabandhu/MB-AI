package com.manabandhu.backend.safety;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogMetric;

@ExtendWith(MockitoExtension.class)
class SafetyContentServiceTest {

    @Mock SafetyReportRepository reportRepository;
    @Mock BlockedUserRepository blockedUserRepository;
    @Mock TrustedContactRepository trustedContactRepository;

    @InjectMocks SafetyContentService service;

    @Test
    void signedInViewerSeesOwnCountsFromRepositories() {
        var userId = UUID.randomUUID();
        when(reportRepository.countByReporterIdAndStatusIn(any(UUID.class), anyCollection())).thenReturn(1L);
        when(blockedUserRepository.countByOwnerId(userId)).thenReturn(0L);
        when(trustedContactRepository.countByOwnerId(userId)).thenReturn(5L);

        var content = service.center(Optional.of(new Actor(userId, false, false)));

        assertThat(content.metrics()).containsExactly(
                new CatalogMetric("Open reports", "1"),
                new CatalogMetric("Blocked users", "0"),
                new CatalogMetric("Trusted contacts", "5"));
    }

    @Test
    void anonymousViewerGetsNoPersonalMetrics() {
        var content = service.center(Optional.empty());

        assertThat(content.metrics()).isEmpty();
        assertThat(content.items()).isNotEmpty();
        verifyNoInteractions(reportRepository, blockedUserRepository, trustedContactRepository);
    }
}
