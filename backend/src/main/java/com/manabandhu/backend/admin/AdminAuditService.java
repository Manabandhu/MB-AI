package com.manabandhu.backend.admin;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Append-only record of privileged actions, shown on the Super Admin audit screen. */
@Service
public class AdminAuditService {

    public record AuditLogEntry(UUID id, String actor, String action, String targetType, String targetId, Instant createdAt) {}

    private final JdbcTemplate jdbcTemplate;

    AdminAuditService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void record(String actor, String action, String targetType, String targetId) {
        jdbcTemplate.update(
                "INSERT INTO public.admin_audit_log (actor, action, target_type, target_id) VALUES (?, ?, ?, ?)",
                actor, action, targetType, targetId);
    }

    @Transactional(readOnly = true)
    public List<AuditLogEntry> recent(int limit) {
        return jdbcTemplate.query(
                "SELECT id, actor, action, target_type, target_id, created_at FROM public.admin_audit_log ORDER BY created_at DESC LIMIT ?",
                (rs, i) -> new AuditLogEntry((UUID) rs.getObject("id"), rs.getString("actor"), rs.getString("action"),
                        rs.getString("target_type"), rs.getString("target_id"), rs.getTimestamp("created_at").toInstant()),
                limit);
    }
}
