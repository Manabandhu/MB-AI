package com.manabandhu.backend.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.catalog.CatalogMetric;

class FoundationContentServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final FoundationContentService service = new FoundationContentService(jdbc);

    @Test
    void profileAndSettingsShowNoInventedNumbers() {
        var viewer = Optional.of(new Actor(UUID.randomUUID(), false, false));
        assertThat(service.screen("profile", viewer).metrics()).isEmpty();
        assertThat(service.screen("settings", viewer).metrics()).isEmpty();
        assertThat(service.screen("search", viewer).metrics()).isEmpty();
        verifyNoInteractions(jdbc);
    }

    @Test
    void savedCountsAreTheCallersOwn() {
        var userId = UUID.randomUUID();
        when(jdbc.queryForObject(contains("room_favorites"), eq(Long.class), eq(userId))).thenReturn(2L);
        when(jdbc.queryForObject(contains("listing_favorites"), eq(Long.class), eq(userId))).thenReturn(9L);

        var content = service.screen("saved", Optional.of(new Actor(userId, false, false)));

        assertThat(content.metrics()).containsExactly(
                new CatalogMetric("Saved rooms", "2"), new CatalogMetric("Saved items", "9"));
        assertThat(content.items()).allSatisfy(item -> assertThat(item.route()).doesNotContain("demo"));
    }

    @Test
    void anonymousViewerGetsNoPersonalMetrics() {
        assertThat(service.screen("saved", Optional.empty()).metrics()).isEmpty();
        assertThat(service.screen("chat", Optional.empty()).metrics()).isEmpty();
        verifyNoInteractions(jdbc);
    }

    @Test
    void publicCountsComeFromTheDatabase() {
        when(jdbc.queryForObject(contains("room_listings"), eq(Long.class))).thenReturn(4L);
        when(jdbc.queryForObject(contains("ride_offers"), eq(Long.class))).thenReturn(0L);

        assertThat(service.screen("home", Optional.empty()).metrics()).containsExactly(
                new CatalogMetric("Active rooms", "4"), new CatalogMetric("Active rides", "0"));
    }

    @Test
    void failedCountIsOmittedInsteadOfReplacedWithAFallback() {
        when(jdbc.queryForObject(anyString(), eq(Long.class)))
                .thenThrow(new DataAccessResourceFailureException("down"));

        assertThat(service.screen("community", Optional.empty()).metrics()).isEmpty();
    }
}
