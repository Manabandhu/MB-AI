package com.manabandhu.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * The member's own data: a JSON export and account deletion (App Store / Play requirement). Both act only on the
 * caller. Deletion needs a sign-in within the last {@link #REAUTH_WINDOW}.
 */
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);
    static final Duration REAUTH_WINDOW = Duration.ofMinutes(10);
    static final int MAX_ROWS_PER_TABLE = 1000;

    /** Tables and the column that names the owner. A fixed list: table and column names never come from input. */
    static final List<String[]> OWNED_DATA = List.of(
            new String[] {"user_onboarding_progress", "user_id"},
            new String[] {"notification_settings", "user_id"},
            new String[] {"notifications", "user_id"},
            new String[] {"assistant_conversations", "user_id"},
            new String[] {"conversation_participants", "user_id"},
            new String[] {"messages", "sender_id"},
            new String[] {"communities", "owner_id"},
            new String[] {"community_members", "user_id"},
            new String[] {"community_posts", "owner_id"},
            new String[] {"post_comments", "author_id"},
            new String[] {"post_reactions", "user_id"},
            new String[] {"room_listings", "owner_id"},
            new String[] {"room_favorites", "user_id"},
            new String[] {"room_bookings", "requester_id"},
            new String[] {"room_inquiries", "sender_id"},
            new String[] {"room_saved_searches", "user_id"},
            new String[] {"room_reports", "reporter_id"},
            new String[] {"ride_offers", "driver_id"},
            new String[] {"ride_requests", "rider_id"},
            new String[] {"ride_bookings", "user_id"},
            new String[] {"ride_participants", "user_id"},
            new String[] {"ride_favorites", "user_id"},
            new String[] {"ride_ratings", "rater_id"},
            new String[] {"job_postings", "owner_id"},
            new String[] {"job_applications", "applicant_id"},
            new String[] {"referrals", "owner_id"},
            new String[] {"events", "organizer_id"},
            new String[] {"event_attendance", "user_id"},
            new String[] {"expense_groups", "owner_id"},
            new String[] {"expense_group_members", "user_id"},
            new String[] {"expenses", "payer_id"},
            new String[] {"expense_splits", "user_id"},
            new String[] {"settlements", "from_user_id"},
            new String[] {"settlements", "to_user_id"},
            new String[] {"listings", "owner_id"},
            new String[] {"listing_favorites", "user_id"},
            new String[] {"immigration_checklists", "owner_id"},
            new String[] {"immigration_resources", "owner_id"},
            new String[] {"package_tracking", "owner_id"},
            new String[] {"safety_reports", "reporter_id"},
            new String[] {"blocked_users", "owner_id"},
            new String[] {"trusted_contacts", "owner_id"});

    private final JdbcTemplate jdbcTemplate;
    private final SupabaseAdminClient supabaseAdmin;

    AccountService(JdbcTemplate jdbcTemplate, SupabaseAdminClient supabaseAdmin) {
        this.jdbcTemplate = jdbcTemplate;
        this.supabaseAdmin = supabaseAdmin;
    }

    /** Everything stored against the caller, table by table (at most 1000 rows each). */
    @Transactional(readOnly = true)
    public Map<String, Object> export(Actor actor) {
        var data = new LinkedHashMap<String, Object>();
        for (var owned : OWNED_DATA) {
            var table = owned[0];
            var column = owned[1];
            if (!columnExists(table, column)) continue;
            var rows = jdbcTemplate.queryForList(
                    "SELECT row_to_json(t)::text FROM public." + table + " t WHERE t." + column + " = ? LIMIT " + MAX_ROWS_PER_TABLE,
                    String.class, actor.id());
            if (rows.isEmpty()) continue;
            var key = data.containsKey(table) ? table + "_as_" + column : table;
            data.put(key, rows.stream().map(RawJson::new).toList());
        }
        var result = new LinkedHashMap<String, Object>();
        result.put("userId", actor.id());
        result.put("exportedAt", Instant.now());
        result.put("data", data);
        return result;
    }

    /**
     * Deletes the caller's account. Shared expense groups they own pass to another member first so the rest of the
     * group keeps its history; then the Supabase auth user is deleted and every row that references it cascades.
     */
    @Transactional
    public void delete(Actor actor, Instant lastSignIn, Instant now) {
        if (lastSignIn == null || lastSignIn.isBefore(now.minus(REAUTH_WINDOW))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "reauth_required");
        }
        if (columnExists("expense_groups", "owner_id") && columnExists("expense_group_members", "user_id")) {
            jdbcTemplate.update("""
                    UPDATE public.expense_groups g
                    SET owner_id = (SELECT m.user_id FROM public.expense_group_members m
                                    WHERE m.group_id = g.id AND m.user_id <> ? ORDER BY m.user_id LIMIT 1)
                    WHERE g.owner_id = ?
                      AND EXISTS (SELECT 1 FROM public.expense_group_members m WHERE m.group_id = g.id AND m.user_id <> ?)
                    """, actor.id(), actor.id(), actor.id());
        }
        supabaseAdmin.deleteUser(actor.id());
        log.info("account_deleted user={}", actor.id());
    }

    private boolean columnExists(String table, String column) {
        var count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
                """, Integer.class, table, column);
        return count != null && count > 0;
    }

    /** A JSON value already serialised by Postgres, written into the response as is. */
    public record RawJson(String json) {
        @Override
        @com.fasterxml.jackson.annotation.JsonValue
        @com.fasterxml.jackson.annotation.JsonRawValue
        public String json() {
            return json;
        }
    }
}
