package com.manabandhu.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

class AccountServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final SupabaseAdminClient supabase = mock(SupabaseAdminClient.class);
    private final AccountService service = new AccountService(jdbc, supabase,
            org.springframework.transaction.support.TransactionOperations.withoutTransaction());
    private final Actor caller = new Actor(UUID.randomUUID(), false, false);
    private final Instant now = Instant.parse("2026-10-11T12:00:00Z");

    @Test
    void deletionNeedsARecentSignIn() {
        assertThatThrownBy(() -> service.delete(caller, now.minus(Duration.ofHours(2)), now))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("reauth_required");
        assertThatThrownBy(() -> service.delete(caller, null, now))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("401");
        verifyNoInteractions(supabase);
    }

    @Test
    void deletionHandsOverSharedGroupsThenDeletesTheAuthUser() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), anyString(), anyString())).thenReturn(1);

        service.delete(caller, now.minus(Duration.ofMinutes(2)), now);

        verify(jdbc).update(contains("UPDATE public.expense_groups"), eq(caller.id()), eq(caller.id()), eq(caller.id()));
        verify(supabase).deleteUser(caller.id());
    }

    @Test
    void exportOnlyReadsTheCallersRows() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), anyString(), anyString())).thenReturn(1);
        when(jdbc.queryForList(anyString(), eq(String.class), any(Object[].class))).thenReturn(List.of());

        var export = service.export(caller);

        assertThat(export).containsEntry("userId", caller.id());
        verify(jdbc, never()).queryForList(anyString(), eq(String.class), eq(UUID.randomUUID()));
        var captor = org.mockito.ArgumentCaptor.forClass(Object[].class);
        verify(jdbc, org.mockito.Mockito.atLeastOnce()).queryForList(anyString(), eq(String.class), captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(args -> assertThat(args).containsExactly(caller.id()));
    }

    @Test
    void recentSignInComesFromTheAmrClaim() {
        var jwt = Jwt.withTokenValue("t").header("alg", "none").subject(caller.id().toString())
                .claim("amr", List.of(Map.of("method", "password", "timestamp", 1_700_000_000L),
                        Map.of("method", "otp", "timestamp", 1_700_000_500L)))
                .build();
        assertThat(RecentSignIn.of(new JwtAuthenticationToken(jwt))).isEqualTo(Instant.ofEpochSecond(1_700_000_500L));
        var bare = Jwt.withTokenValue("t").header("alg", "none").subject(caller.id().toString()).build();
        assertThat(RecentSignIn.of(new JwtAuthenticationToken(bare))).isNull();
    }
}
