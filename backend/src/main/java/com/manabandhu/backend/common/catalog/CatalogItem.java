package com.manabandhu.backend.common.catalog;

public record CatalogItem(
        String id,
        String title,
        String body,
        String meta,
        String route,
        String status) {}
