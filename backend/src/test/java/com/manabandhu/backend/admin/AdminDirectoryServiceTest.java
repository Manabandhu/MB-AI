package com.manabandhu.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

class AdminDirectoryServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final AdminAuditService audit = mock(AdminAuditService.class);
    // Supabase is configured so a passing check would reach the network; every case here must stop before that.
    private final AdminDirectoryService service =
            new AdminDirectoryService(jdbc, audit, "http://127.0.0.1:1", "service-role");
    private final Actor admin = new Actor(UUID.randomUUID(), true, false);
    private final Actor superAdmin = new Actor(UUID.randomUUID(), true, true);

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @SuppressWarnings("unchecked")
    private void targetHasRole(UUID id, String role) {
        when(jdbc.query(anyString(), any(RowMapper.class), eq(id))).thenReturn(List.of(
                new AdminDirectoryService.AdminUser(id, "Target", "t@example.test", role, "Active", Instant.now())));
    }

    @Test
    void membersCannotChangeAccountStatus() {
        var member = new Actor(UUID.randomUUID(), false, false);
        assertThatThrownBy(() -> service.setStatus(member, UUID.randomUUID(), "suspended"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(audit);
    }

    @Test
    void adminsCannotSuspendThemselves() {
        assertThatThrownBy(() -> service.setStatus(admin, admin.id(), "suspended"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(audit);
    }

    @Test
    void superAdminsCannotBeSuspended() {
        var target = UUID.randomUUID();
        targetHasRole(target, "SUPER_ADMIN");

        assertThatThrownBy(() -> service.setStatus(superAdmin, target, "suspended"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(audit);
    }

    @Test
    void onlySuperAdminsSuspendAdmins() {
        var target = UUID.randomUUID();
        targetHasRole(target, "admin");

        assertThatThrownBy(() -> service.setStatus(admin, target, "suspended"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(audit);
    }
}
