package com.manabandhu.backend.admin;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Read-only moderation projections across modules, plus account suspension through the Supabase Auth admin API.
 * Lists are capped so a dashboard request can never scan an unbounded table.
 */
@Service
class AdminDirectoryService {

    private static final Logger log = LoggerFactory.getLogger(AdminDirectoryService.class);
    static final int LIMIT = 200;
    /** Supabase "ban" duration used for suspension (about 100 years); "none" lifts it. */
    private static final String SUSPEND_DURATION = "876000h";

    record AdminUser(UUID id, String name, String email, String role, String status, Instant createdAt) {}
    record AdminRoom(UUID id, String title, String hostName, String status, boolean reported, Instant createdAt) {}
    record AdminJob(UUID id, String title, String company, String status, boolean reported, Instant createdAt) {}
    record AdminEvent(UUID id, String title, String organizer, Instant date, String status, boolean reported, Instant createdAt) {}
    record AdminCommunityPost(UUID id, String communityName, String authorName, String title, String status,
                              boolean reported, Instant createdAt) {}

    private final JdbcTemplate jdbcTemplate;
    private final AdminAuditService audit;
    private final RestTemplate restTemplate;
    private final String supabaseProjectUrl;
    private final String serviceRoleKey;

    AdminDirectoryService(JdbcTemplate jdbcTemplate, AdminAuditService audit,
                          @Value("${app.supabase.project-url:}") String supabaseProjectUrl,
                          @Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
        this.jdbcTemplate = jdbcTemplate;
        this.audit = audit;
        this.supabaseProjectUrl = supabaseProjectUrl;
        this.serviceRoleKey = serviceRoleKey;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    private static String shortId(Object id) {
        return id == null ? "Unknown" : "Member (" + id.toString().substring(0, 8) + ")";
    }

    @Transactional(readOnly = true)
    List<AdminRoom> rooms() {
        return jdbcTemplate.query("""
                SELECT l.id, l.title, l.owner_id, l.status, l.created_at,
                       EXISTS (SELECT 1 FROM public.room_reports r WHERE r.listing_id = l.id AND r.status IN ('open', 'in_review')) AS reported
                FROM public.room_listings l ORDER BY l.created_at DESC LIMIT ?
                """, (rs, i) -> new AdminRoom((UUID) rs.getObject("id"), rs.getString("title"),
                shortId(rs.getObject("owner_id")), rs.getString("status"), rs.getBoolean("reported"), instant(rs, "created_at")), LIMIT);
    }

    @Transactional(readOnly = true)
    List<AdminJob> jobs() {
        return jdbcTemplate.query("""
                SELECT id, title, company, status, created_at FROM public.job_postings ORDER BY created_at DESC LIMIT ?
                """, (rs, i) -> new AdminJob((UUID) rs.getObject("id"), rs.getString("title"), rs.getString("company"),
                rs.getString("status"), false, instant(rs, "created_at")), LIMIT);
    }

    @Transactional(readOnly = true)
    List<AdminEvent> events() {
        return jdbcTemplate.query("""
                SELECT id, title, organizer_id, start_at, status, created_at FROM public.events ORDER BY created_at DESC LIMIT ?
                """, (rs, i) -> new AdminEvent((UUID) rs.getObject("id"), rs.getString("title"),
                shortId(rs.getObject("organizer_id")), instant(rs, "start_at"), rs.getString("status"), false,
                instant(rs, "created_at")), LIMIT);
    }

    @Transactional(readOnly = true)
    List<AdminCommunityPost> communityPosts() {
        return jdbcTemplate.query("""
                SELECT p.id, p.title, p.owner_id, p.created_at, c.name AS community_name
                FROM public.community_posts p LEFT JOIN public.communities c ON c.id = p.community_id
                ORDER BY p.created_at DESC LIMIT ?
                """, (rs, i) -> new AdminCommunityPost((UUID) rs.getObject("id"),
                rs.getString("community_name") != null ? rs.getString("community_name") : "General",
                shortId(rs.getObject("owner_id")), rs.getString("title"), "published", false,
                instant(rs, "created_at")), LIMIT);
    }

    @Transactional(readOnly = true)
    List<AdminUser> users() {
        try {
            return jdbcTemplate.query(USER_SELECT + " ORDER BY created_at DESC LIMIT ?", this::mapUser, LIMIT);
        } catch (DataAccessException exception) {
            log.warn("User directory query failed: {}", exception.getMostSpecificCause().getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "User directory is not available");
        }
    }

    @Transactional(readOnly = true)
    AdminUser user(UUID id) {
        try {
            return jdbcTemplate.query(USER_SELECT + " WHERE id = ?", this::mapUser, id).stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "User directory is not available");
        }
    }

    /**
     * Suspends or reactivates an account by banning it in Supabase Auth, which also blocks new sessions.
     * Admins only; nobody can change their own status, super admins cannot be suspended here, and only a
     * super admin can suspend another admin. Every change is written to {@code admin_audit_log}.
     */
    AdminUser setStatus(Actor actor, UUID id, String status) {
        actor.requireAdmin();
        var suspend = "suspended".equalsIgnoreCase(status);
        if (!suspend && !"active".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be Active or Suspended");
        }
        if (actor.is(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot change your own account status");
        }
        if (suspend) {
            var role = user(id).role();
            var targetRole = role == null ? "" : role.trim().toLowerCase(java.util.Locale.ROOT);
            if (targetRole.equals("super_admin")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admins cannot be suspended here");
            }
            if (targetRole.equals("admin") && !actor.superAdmin()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only a super admin can suspend an admin");
            }
        }
        if (supabaseProjectUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase admin API is not configured");
        }
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        headers.set("apikey", serviceRoleKey);
        try {
            restTemplate.exchange(supabaseProjectUrl + "/auth/v1/admin/users/" + id, HttpMethod.PUT,
                    new HttpEntity<>(Map.of("ban_duration", suspend ? SUSPEND_DURATION : "none"), headers), String.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Supabase rejected the status change", exception);
        }
        audit.record(actor.id().toString(), "user." + (suspend ? "suspended" : "active"), "USER", id.toString());
        return user(id);
    }

    private static final String USER_SELECT = """
            SELECT id, email, created_at, banned_until,
                   raw_user_meta_data ->> 'full_name' AS full_name,
                   COALESCE(raw_app_meta_data -> 'roles' ->> 0, 'user') AS role
            FROM auth.users""";

    private AdminUser mapUser(ResultSet rs, int row) throws SQLException {
        var bannedUntil = rs.getTimestamp("banned_until");
        var suspended = bannedUntil != null && bannedUntil.toInstant().isAfter(Instant.now());
        var name = rs.getString("full_name");
        return new AdminUser((UUID) rs.getObject("id"), name != null ? name : "—", rs.getString("email"),
                rs.getString("role"), suspended ? "Suspended" : "Active", instant(rs, "created_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        var timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }
}
