package com.manabandhu.backend.referrals;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class ReferralsContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content(
                    "Referrals and support",
                    "Request help, offer skills, and build trusted referral chains in your community.",
                    "Referrals",
                    java.util.List.of(
                            new CatalogMetric("Open requests", "8"),
                            new CatalogMetric("Active offers", "5")),
                    java.util.List.of(
                            item("request", "Request help", "Ask your community for a referral or introduction.", "Open", "/referrals/request"),
                            item("offer", "Offer help", "Share your skills and availability with your community.", "Open", "/referrals/offer")));
            case "mine" -> content(
                    "My referrals",
                    "Track your requests, offers, and referral chain status in one place.",
                    "Referrals",
                    java.util.List.of(
                            new CatalogMetric("Requests", "4"),
                            new CatalogMetric("Offers", "2")),
                    java.util.List.of(
                            item("requests", "My requests", "Track requests you have made and their status.", "Requests", "/referrals"),
                            item("offers", "My offers", "Manage offers you have made and their status.", "Offers", "/referrals/offer")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                 java.util.List<CatalogMetric> metrics,
                                                 java.util.List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}