package com.manabandhu.backend.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * Shared page limits. Lists that are not paged by the client return at most {@link #LIST_CAP} rows; GraphQL list
 * fields and short feeds use {@link #SHORT_LIST_CAP}. Client-supplied sizes are clamped, never trusted.
 */
public final class Paging {

    /** Upper bound for "my items" style lists returned in one response. */
    public static final int LIST_CAP = 200;

    /** Upper bound for GraphQL list fields, feeds, and client-paged searches. */
    public static final int SHORT_LIST_CAP = 100;

    private Paging() {}

    /** The first {@code size} rows, unsorted (the repository query orders them). */
    public static PageRequest firstPage(int size) {
        return PageRequest.of(0, size);
    }

    /** The first {@link #LIST_CAP} rows. */
    public static PageRequest firstPage() {
        return firstPage(LIST_CAP);
    }

    /** {@code requested} limited to 1..{@code max}; {@code fallback} when the client sent nothing. */
    public static int clamp(Integer requested, int fallback, int max) {
        if (requested == null) return fallback;
        return Math.max(1, Math.min(requested, max));
    }

    /** A page request with a non-negative page and a size limited to 1..{@code max}. */
    public static PageRequest bounded(int page, int size, int max) {
        return PageRequest.of(Math.max(0, page), clamp(size, max, max));
    }

    /** The client's page number with its size capped at {@code max}; client sort parameters are dropped. */
    public static PageRequest bounded(Pageable pageable, int max) {
        return bounded(pageable.getPageNumber(), pageable.getPageSize(), max);
    }
}
