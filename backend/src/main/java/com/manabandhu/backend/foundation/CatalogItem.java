package com.manabandhu.backend.foundation;

public record CatalogItem(
        String id,
        String title,
        String body,
        String meta,
        String route,
        String status) {}
