package com.manabandhu.backend.foundation;

import java.util.List;

public record CatalogScreenContent(
        String title,
        String subtitle,
        String eyebrow,
        List<CatalogMetric> metrics,
        List<CatalogItem> items) {}
