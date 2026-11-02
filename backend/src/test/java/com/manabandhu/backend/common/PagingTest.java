package com.manabandhu.backend.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

class PagingTest {

    @Test
    void clampUsesTheFallbackWhenNothingWasRequested() {
        assertThat(Paging.clamp(null, 30, 100)).isEqualTo(30);
    }

    @Test
    void clampKeepsSizesBetweenOneAndTheMaximum() {
        assertThat(Paging.clamp(0, 30, 100)).isEqualTo(1);
        assertThat(Paging.clamp(-5, 30, 100)).isEqualTo(1);
        assertThat(Paging.clamp(500, 30, 100)).isEqualTo(100);
        assertThat(Paging.clamp(42, 30, 100)).isEqualTo(42);
    }

    @Test
    void boundedNeverGoesBelowTheFirstPageAndDropsClientSort() {
        var request = Paging.bounded(PageRequest.of(3, 1_000, Sort.by("price")), Paging.SHORT_LIST_CAP);
        assertThat(request.getPageNumber()).isEqualTo(3);
        assertThat(request.getPageSize()).isEqualTo(Paging.SHORT_LIST_CAP);
        assertThat(request.getSort().isUnsorted()).isTrue();
        assertThat(Paging.bounded(-1, 10, 50).getPageNumber()).isZero();
    }

    @Test
    void firstPageDefaultsToTheListCap() {
        assertThat(Paging.firstPage().getPageSize()).isEqualTo(Paging.LIST_CAP);
        assertThat(Paging.firstPage().getPageNumber()).isZero();
    }

    @Test
    void blankToNullTrimsAndDropsBlankValues() {
        assertThat(Strings.blankToNull(null)).isNull();
        assertThat(Strings.blankToNull("   ")).isNull();
        assertThat(Strings.blankToNull("  rent ")).isEqualTo("rent");
    }
}
