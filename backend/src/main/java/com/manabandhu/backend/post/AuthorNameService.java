package com.manabandhu.backend.post;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Public display names for post and comment authors: the member's chosen nickname, else the first word of the name
 * their sign-in provider gave, else "Member". Never returns emails or full names. Callers resolve names after their
 * read transaction has returned, so a request never holds two connections; a directory failure degrades to
 * "Member" instead of failing the read. Large id sets are looked up in batches, never truncated.
 */
@Service
public class AuthorNameService {

    static final String FALLBACK = "Member";
    static final int BATCH = 500;
    private static final Logger log = LoggerFactory.getLogger(AuthorNameService.class);

    private final JdbcTemplate jdbcTemplate;

    AuthorNameService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<UUID, String> names(Collection<UUID> userIds) {
        var ids = new ArrayList<UUID>(new LinkedHashSet<>(userIds.stream().filter(java.util.Objects::nonNull).toList()));
        var result = new HashMap<UUID, String>();
        for (int from = 0; from < ids.size(); from += BATCH) {
            lookup(ids.subList(from, Math.min(ids.size(), from + BATCH)), result);
        }
        return result;
    }

    private void lookup(List<UUID> ids, Map<UUID, String> result) {
        var placeholders = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        try {
            jdbcTemplate.query("""
                    SELECT id, COALESCE(
                        NULLIF(btrim(raw_user_meta_data ->> 'nickname'), ''),
                        NULLIF(split_part(btrim(raw_user_meta_data ->> 'full_name'), ' ', 1), ''),
                        NULLIF(split_part(btrim(raw_user_meta_data ->> 'name'), ' ', 1), '')) AS display_name
                    FROM auth.users WHERE id IN (""" + placeholders + ")",
                    rs -> {
                        var name = rs.getString("display_name");
                        if (name != null && !name.isBlank()) {
                            result.put((UUID) rs.getObject("id"), name.length() > 40 ? name.substring(0, 40) : name);
                        }
                    }, ids.toArray());
        } catch (DataAccessException exception) {
            log.warn("Author name lookup failed: {}", exception.getMostSpecificCause().getMessage());
        }
    }

    static String nameOf(Map<UUID, String> names, UUID userId) {
        return names.getOrDefault(userId, FALLBACK);
    }
}
