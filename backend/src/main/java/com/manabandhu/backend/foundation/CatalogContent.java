package com.manabandhu.backend.foundation;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalLong;
import java.util.function.Function;
import java.util.function.ToLongFunction;

import com.manabandhu.backend.auth.Actor;

/**
 * Shared building blocks for the {@code /screens/{screenId}} content services. Metrics are real counts only:
 * personal metrics are added for a signed-in viewer and omitted for anonymous ones, and a count that could not be
 * read ({@link OptionalLong#empty()}) is left out rather than replaced with a made-up number.
 */
public final class CatalogContent {

    private CatalogContent() {}

    /** A navigation item without a status badge. */
    public static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }

    public static CatalogMetric metric(String label, long value) {
        return new CatalogMetric(label, String.valueOf(value));
    }

    /** Metrics computed for the signed-in viewer; anonymous viewers get none. */
    public static List<CatalogMetric> personal(Optional<Actor> viewer, Function<Actor, List<CatalogMetric>> metrics) {
        return viewer.map(metrics).orElse(List.of());
    }

    public static Metrics metrics() {
        return new Metrics();
    }

    /** Ordered metric list mixing public counts with viewer-only ones. */
    public static final class Metrics {

        private final List<CatalogMetric> metrics = new ArrayList<>();

        private Metrics() {}

        public Metrics add(String label, long value) {
            metrics.add(metric(label, value));
            return this;
        }

        /** Adds the count when it was read; an empty value (failed or unavailable query) is omitted. */
        public Metrics add(String label, OptionalLong value) {
            value.ifPresent(count -> add(label, count));
            return this;
        }

        /** Adds a viewer-only count; nothing is computed or added for anonymous viewers. */
        public Metrics addFor(Optional<Actor> viewer, String label, ToLongFunction<Actor> count) {
            viewer.ifPresent(actor -> add(label, count.applyAsLong(actor)));
            return this;
        }

        public List<CatalogMetric> build() {
            return List.copyOf(metrics);
        }
    }
}
