package com.manabandhu.backend.foundation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class FoundationContentService {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public FoundationContentService(@Autowired(required = false) JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private long countTable(String sql, long fallback) {
        if (jdbcTemplate == null) {
            return fallback;
        }
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : fallback;
        } catch (Exception e) {
            return fallback;
        }
    }

    private static final String HELP_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLuihH-mSVxYhIAX0g3XSpYMHRaSs0kbK5uQCKWYinPX-8Gkfl0D6QOOYna7jkBL-XBFoAgVulXErCpyQxyPCXcAFjLvy8jUchV2mluO1-uL1mm0N53J5icFnoXEut4vWkPDovzsDhbjMYB3SbmrvZvVAFyhDinQIniIh2UHI3jjzSfcdaU86ZtypYnANXAoePqFb5RoSedJnEh9vDlYoCc5JD_MXTe_2yhbvQKJTTzwkevVyWz28B_ktfg";
    private static final String TRUST_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLtUf2ODs2thv2Z3Tn-zrq2aaYnq5daSL9KBeeHzLFYPNJDJO4vD7UcsoIaltEvAbFrubE_vZrNGdGO7BzEX972UyQL9JthY2LS5FgRQMeLeAS43Xo2flktTuSUyxHVbfsTJ4G76kcuaR1yjJrSb6yZIoYTXfaPKaAkfNWGohBFMJV2Oa5QuO7-okaQO5kx7T2Gw7fqG8KggE0Vdny10VVgAS-d0JbHYNSThckQ6FCLQaVD-scfhzIQK9x8";
    private static final String LIFE_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLsnX0Z0wRXO1bksJlF36mVKcxGpWmLHDKh29_dDO-daHA-WP1kZN6-es7SZecpR_E9zdLoffF80G3fOX9M0i3_caLaWhTKfh0-eg85lYLp4mxvpEOp4DdqjjekgMhByhMLrJggPuIra_sofSIGmHJ6DnTE4EOKEaGGD04XoInVhxLtiYar_nTsvhPklWvpaxQOZ_9-FLtTUoVx71PxgUfThSVk0lbXBgQ0v1ODZt0a9mZ_Z62QyFc52xCs";
    private static final String LOGO_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLs0M1VGWNL3Xb3bF48xlOO2okf2eA24_UPS48maqbG97LuRBxmy4MWa1EtNlhOccVHifqVSUVIZMEU8-z8rsfgeyO65DQnP88qQz663DzrUX5es6RnPDkfASjguVcvCdVPEuRyVOuxZ4LzuBAmnL56HffFOvvkN2RrEaQhGap8pFXIfd0PjH3E596K6DQ8MhlhExd20h3bM-ZC8fNpNcwXcNxyHpAQr2WRcOw-EuyZ0y25eWiUrN-9RUg";

    WelcomeFlow welcomeFlow() {
        return new WelcomeFlow(
                new SplashContent("ManaBandhu", "Your trusted community, wherever you are.", LOGO_IMAGE_URL),
                List.of(
                        new WelcomeStep(
                                "find-help",
                                "Find the help you need",
                                "Rooms, rides, jobs, local services, and useful information in one friendly app.",
                                HELP_IMAGE_URL,
                                "Next",
                                null),
                        new WelcomeStep(
                                "trusted-community",
                                "Connect with people you can trust",
                                "Ask questions, join communities, chat safely, and meet people nearby.",
                                TRUST_IMAGE_URL,
                                "Next",
                                null),
                        new WelcomeStep(
                                "everyday-life",
                                "Make everyday life easier.",
                                "Share expenses, find events, track packages, and stay organized.",
                                LIFE_IMAGE_URL,
                                "Next",
                                null),
                        new WelcomeStep(
                                "get-started",
                                "Welcome to ManaBandhu",
                                "Your global community for meaningful connections and support is ready.",
                                LOGO_IMAGE_URL,
                                "Get Started",
                                "Sign In")));
    }

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> {
                long activeRooms = countTable("SELECT count(*) FROM room_listings WHERE status = 'active'", 12);
                long activeRides = countTable("SELECT count(*) FROM ride_offers WHERE status = 'active'", 6);
                yield new CatalogScreenContent(
                        "Your day at a glance",
                        "Rooms, rides, jobs, community, and chat updates tailored to your interests and location.",
                        "Home",
                        List.of(
                                new CatalogMetric("Active rooms", String.valueOf(activeRooms)),
                                new CatalogMetric("Active rides", String.valueOf(activeRides))),
                        List.of(
                                item("rooms", "Find a room", "Browse shared housing with privacy-aware location.", "Open rooms", "/rooms"),
                                item("rides", "Offer a ride", "Post a ride with route, time, and seats.", "Open rides", "/rides/offer"),
                                item("jobs", "Ask a question", "Join communities and chat safely.", "Open chat", "/community")));
            }
            case "chat" -> {
                long totalConvs = countTable("SELECT count(*) FROM conversations", 8);
                long totalMsgs = countTable("SELECT count(*) FROM messages", 3);
                yield new CatalogScreenContent(
                        "Stay in touch",
                        "Your conversations, group chats, and support threads in one inbox.",
                        "Chat",
                        List.of(
                                new CatalogMetric("Conversations", String.valueOf(totalConvs)),
                                new CatalogMetric("Messages", String.valueOf(totalMsgs))),
                        List.of(
                                item("all", "All conversations", "Jump into any open chat thread.", "Inbox", "/chat"),
                                item("groups", "Group chats", "Communities, rides, and rooms group chats.", "Groups", "/chat/new")));
            }
            case "community" -> {
                long groups = countTable("SELECT count(*) FROM communities", 14);
                long posts = countTable("SELECT count(*) FROM community_posts", 31);
                yield new CatalogScreenContent(
                        "Community hubs",
                        "Join groups, read posts, and find help from people nearby.",
                        "Community",
                        List.of(
                                new CatalogMetric("Groups", String.valueOf(groups)),
                                new CatalogMetric("Posts", String.valueOf(posts))),
                        List.of(
                                item("discover", "Discover groups", "Find communities by interest, location, and need.", "Explore", "/community/discover"),
                                item("posts", "Recent posts", "Read and reply to posts from joined communities.", "Feed", "/community")));
            }
            case "onboarding" -> new CatalogScreenContent(
                    "Set up your ManaBandhu space",
                    "Choose your city, interests, and safety preferences so the app feels useful from day one.",
                    "Getting Started",
                    List.of(new CatalogMetric("Setup time", "2 min"), new CatalogMetric("Privacy steps", "3")),
                    List.of(
                            item("location", "Pick your local area", "Use a broad neighborhood or city so discovery works without exposing precise location.", "Location privacy first", "/explore"),
                            item("interests", "Select what you need", "Rooms, rides, jobs, events, community help, safety, and utilities can be tuned any time.", "Personalized modules", "/settings")));
            case "explore" -> {
                long totalRooms = countTable("SELECT count(*) FROM room_listings", 24);
                long totalEvents = countTable("SELECT count(*) FROM events", 8);
                yield new CatalogScreenContent(
                        "Everything nearby, organized",
                        "Jump into rooms, rides, jobs, events, services, and community posts from one discovery surface.",
                        "Explore",
                        List.of(
                                new CatalogMetric("Rooms", String.valueOf(totalRooms)),
                                new CatalogMetric("Events", String.valueOf(totalEvents))),
                        List.of(
                                item("rooms", "Rooms", "Find shared housing and trusted listings.", "Open rooms", "/rooms"),
                                item("rides", "Rides", "Offer or request safe local and airport rides.", "Open rides", "/rides"),
                                item("notifications", "Notifications", "See updates from your communities and saved searches.", "Open inbox", "/notifications")));
            }
            case "search" -> new CatalogScreenContent(
                    "Search across ManaBandhu",
                    "A unified search home for listings, rides, people, guides, events, and help requests.",
                    "Search",
                    List.of(new CatalogMetric("Categories", "12"), new CatalogMetric("Recent searches", "5")),
                    List.of(
                            item("query", "Start with a need", "Try room near Plano, airport ride, or job referral.", "Smart suggestions", "/rooms/search"),
                            item("filters", "Refine fast", "Filter by distance, price, availability, trust signals, and module.", "Cross-module filters", "/rides/filters")));
            case "saved" -> {
                long savedRooms = countTable("SELECT count(*) FROM room_favorites", 18);
                long savedListings = countTable("SELECT count(*) FROM listing_favorites", 6);
                yield new CatalogScreenContent(
                        "Your saved things",
                        "Saved rooms, rides, events, jobs, marketplace items, and resources live in one calm place.",
                        "Saved",
                        List.of(
                                new CatalogMetric("Saved rooms", String.valueOf(savedRooms)),
                                new CatalogMetric("Saved items", String.valueOf(savedListings))),
                        List.of(
                                item("room", "Sunny room in Irving", "Available next month with verified host notes.", "Room", "/rooms/demo-room-1"),
                                item("ride", "DFW airport ride", "Saturday morning ride with two seats left.", "Ride", "/rides/search")));
            }
            case "profile" -> new CatalogScreenContent(
                    "Your community profile",
                    "Manage your visible name, trust signals, interests, and the ways others can safely contact you.",
                    "Profile",
                    List.of(new CatalogMetric("Profile strength", "72%"), new CatalogMetric("Trust checks", "2")),
                    List.of(
                            item("identity", "Identity and privacy", "Control your display name, pronouns, language, and location precision.", "Editable", "/settings"),
                            item("activity", "Recent activity", "Your posts, listings, rides, saves, and community contributions.", "Private by default", "/saved")));
            case "settings" -> new CatalogScreenContent(
                    "Preferences and safety",
                    "Tune notifications, language, privacy, blocked users, security, and app appearance.",
                    "Settings",
                    List.of(new CatalogMetric("Notification groups", "5"), new CatalogMetric("Privacy controls", "8")),
                    List.of(
                            item("notifications", "Notification preferences", "Choose what reaches in-app, push, email, or SMS later.", "Review", "/notifications"),
                            item("privacy", "Privacy and safety", "Manage blocked users, trusted contacts, and sensitive data choices.", "Protected", "/profile")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
