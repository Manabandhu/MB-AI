package com.manabandhu.backend.safety;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class SafetyReportServiceTest {

    private final SafetyReportRepository repository = mock(SafetyReportRepository.class);
    private final SafetyReportService service = new SafetyReportService(repository);

    @Test
    void reportersCannotResolveTheirOwnReports() {
        var reporter = new Actor(UUID.randomUUID(), false, false);

        assertThatThrownBy(() -> service.resolve(reporter, UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
        verifyNoInteractions(repository);
    }

    @Test
    void moderationQueueIsAdminOnly() {
        assertThatThrownBy(() -> service.findAllForAdmin(new Actor(UUID.randomUUID(), false, false)))
                .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(repository);
    }

    @Test
    void adminsResolveReports() {
        var report = new SafetyReport(UUID.randomUUID(), UUID.randomUUID(), "harassment", "details",
                SafetyReport.ReportStatus.OPEN, SafetyReport.Severity.values()[0], null);
        var id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(report));

        assertThat(service.resolve(new Actor(UUID.randomUUID(), true, false), id).getStatus())
                .isNotEqualTo(SafetyReport.ReportStatus.OPEN);
    }
}
