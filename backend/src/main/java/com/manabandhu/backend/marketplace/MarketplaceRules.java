package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** Allowed listing values and status changes; anything else is a 400 or 409 instead of a database error. */
final class MarketplaceRules {

    static final String CONDITIONS = "Brand New|Like New|Gently Used|Fair|Used";
    static final String CURRENCY = "[A-Z]{3}";
    static final String NOT_BLANK = "(?s).*\\S.*";
    static final Set<String> PUBLIC_STATUSES = Set.of("active", "reserved", "sold");
    static final int MAX_IMAGES = 10;

    /** Owners move between active, reserved and sold; only moderators remove or restore. */
    static final Map<String, List<String>> OWNER_TRANSITIONS = Map.of(
            "active", List.of("reserved", "sold"),
            "reserved", List.of("active", "sold"),
            "sold", List.of("active"),
            "removed", List.of());

    private MarketplaceRules() {
    }
}
